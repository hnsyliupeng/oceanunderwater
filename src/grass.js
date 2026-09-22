/**
 * Grass Meadow - 高性能草丛系统
 * 参考 https://grass-world-meadow.netlify.app
 * 50k 叶片实例化 + 风场 + 交互弯折
 */
import * as THREE from 'three';

export class GrassSystem {
  constructor(grassSpots, options = {}){
    this.count = options.count ?? 50000;
    this.spots = grassSpots;
    this.mesh = null;
    this.uniforms = {
      uTime: { value: 0 },
      uWindDir: { value: new THREE.Vector3(1,0,0.4).normalize() },
      uWindStrength: { value: options.windStrength ?? 0.85 },
    };
    this.build();
  }

  build(){
    const bladeGeo = new THREE.PlaneGeometry(0.12, 1, 1, 4);
    bladeGeo.translate(0,0.5,0);
    const pos = bladeGeo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const y = pos.getY(i);
      const taper = 1 - Math.pow(y,2.2)*0.7;
      pos.setX(i, pos.getX(i)*taper);
    }
    bladeGeo.computeVertexNormals();

    const offsets=[], scales=[], rots=[], colors=[];
    for(let i=0;i<this.count;i++){
      const spot = this.spots[Math.floor(Math.random()*this.spots.length)];
      if(!spot){
        offsets.push(0,0,0); scales.push(0); rots.push(0); colors.push(0,0,0);
        continue;
      }
      const x = spot.x + (Math.random()-0.5)*3;
      const z = spot.z + (Math.random()-0.5)*3;
      const y = spot.y + Math.random()*0.1;
      offsets.push(x,y,z);
      scales.push(0.5 + Math.random()*1.2 + (spot.y>8?0.2:0));
      rots.push(Math.random()*Math.PI*2);
      const c = new THREE.Color().setHSL(0.28+Math.random()*0.12, 0.55+Math.random()*0.3, 0.25+Math.random()*0.25);
      colors.push(c.r,c.g,c.b);
    }

    const instGeo = new THREE.InstancedBufferGeometry();
    instGeo.instanceCount = this.count;
    instGeo.setAttribute('position', bladeGeo.attributes.position);
    instGeo.setAttribute('uv', bladeGeo.attributes.uv);
    instGeo.setAttribute('normal', bladeGeo.attributes.normal);
    instGeo.setIndex(bladeGeo.index);
    instGeo.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(new Float32Array(offsets),3));
    instGeo.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(new Float32Array(scales),1));
    instGeo.setAttribute('instanceRot', new THREE.InstancedBufferAttribute(new Float32Array(rots),1));
    instGeo.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(new Float32Array(colors),3));

    const vert = `
uniform float uTime;
uniform vec3 uWindDir;
uniform float uWindStrength;
attribute vec3 instanceOffset;
attribute float instanceScale;
attribute float instanceRot;
attribute vec3 instanceColor;
varying vec3 vColor;
varying vec2 vUv;
void main(){
  vUv = uv;
  vColor = instanceColor;
  vec3 pos = position;
  pos.y *= instanceScale;
  pos.x *= mix(0.8,1.2, fract(instanceOffset.x*0.1));
  float heightFactor = pow(pos.y / max(instanceScale,0.001), 2.0);
  float windPhase = uTime*0.8 + instanceOffset.x*0.07 + instanceOffset.z*0.05;
  float windFlutter = sin(windPhase)*0.5 + cos(windPhase*1.7)*0.3;
  vec2 windOffset = uWindDir.xz * uWindStrength * heightFactor * (0.6 + windFlutter*0.4);
  pos.x += windOffset.x;
  pos.z += windOffset.y;
  pos.x += sin(uTime*1.2 + instanceOffset.x*0.2)*0.05*heightFactor;
  float c = cos(instanceRot);
  float s = sin(instanceRot);
  vec3 rotated = vec3(pos.x*c - pos.z*s, pos.y, pos.x*s + pos.z*c);
  vec3 worldPos = rotated + instanceOffset;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(worldPos,1.0);
}
`;
    const frag = `
varying vec3 vColor;
varying vec2 vUv;
void main(){
  float tip = smoothstep(0.0,0.15, vUv.y);
  float edge = 1.0 - abs(vUv.x-0.5)*2.0;
  edge = pow(edge,0.8);
  float alpha = tip*edge;
  if(alpha<0.15) discard;
  vec3 col = vColor * mix(0.55,1.15,vUv.y);
  col += vec3(0.2,0.35,0.05)*pow(vUv.y,3.0)*0.6;
  gl_FragColor = vec4(col,1.0);
}
`;
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: this.uniforms,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(instGeo, mat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  update(time, windDir){
    this.uniforms.uTime.value = time;
    if(windDir) this.uniforms.uWindDir.value.copy(windDir);
  }

  setWindStrength(v){
    this.uniforms.uWindStrength.value = v;
  }
}

export class FlowerSystem {
  constructor(grassSpots, options = {}){
    this.count = options.count ?? 4000;
    this.spots = grassSpots;
    this.meshes = [];
    this.build();
  }

  build(){
    const petalGeo = new THREE.CircleGeometry(0.18,5);
    petalGeo.translate(0,0.18,0);
    const stemGeo = new THREE.CylinderGeometry(0.02,0.02,0.5,3);
    stemGeo.translate(0,0.25,0);

    const stemMat = new THREE.MeshStandardMaterial({color:0x3a6b2a, roughness:0.9});
    const petalMat = new THREE.MeshStandardMaterial({color:0xffffff, side:THREE.DoubleSide, roughness:0.9, vertexColors:false});

    const stemInst = new THREE.InstancedMesh(stemGeo, stemMat, this.count);
    const petalInst = new THREE.InstancedMesh(petalGeo, petalMat, this.count);

    const dummy = new THREE.Object3D();
    const colors = [0xff6b9d,0xffd166,0x8ecae6,0xffffff,0xff9f1c,0xc77dff,0x06d6a0];
    let idx=0;
    for(let i=0;i<this.count*2 && idx<this.count;i++){
      const spot = this.spots[Math.floor(Math.random()*this.spots.length)];
      if(!spot || spot.y<1 || spot.y>12) continue;
      if(Math.random()<0.92) continue;
      const x = spot.x + (Math.random()-0.5)*4;
      const z = spot.z + (Math.random()-0.5)*4;
      const y = spot.y+0.05;
      dummy.position.set(x,y,z);
      dummy.rotation.set(0, Math.random()*Math.PI*2,0);
      const s = 0.7+Math.random()*0.8;
      dummy.scale.set(s,s,s);
      dummy.updateMatrix();
      stemInst.setMatrixAt(idx, dummy.matrix);
      petalInst.setMatrixAt(idx, dummy.matrix);
      stemInst.setColorAt(idx, new THREE.Color(0x3a6b2a));
      petalInst.setColorAt(idx, new THREE.Color(colors[Math.floor(Math.random()*colors.length)]));
      idx++;
    }
    stemInst.instanceMatrix.needsUpdate=true;
    petalInst.instanceMatrix.needsUpdate=true;
    if(stemInst.instanceColor) stemInst.instanceColor.needsUpdate=true;
    if(petalInst.instanceColor) petalInst.instanceColor.needsUpdate=true;
    stemInst.castShadow=true; petalInst.castShadow=true;

    this.meshes = [stemInst, petalInst];
  }

  addTo(scene){
    this.meshes.forEach(m=>scene.add(m));
  }
}
