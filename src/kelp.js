/**
 * Kelp Forest - 水下海带森林
 * 参考 Jelly Garden 水下植被
 */
import * as THREE from 'three';

export class KelpForest {
  constructor(options={}){
    this.count = options.count ?? 400;
    this.mesh = null;
    this.uniforms = {
      uTime:{value:0},
      uCurrentDir:{value:new THREE.Vector3(0.6,0,0.3)},
      uCurrentStrength:{value:0.6},
    };
    this.build();
  }

  build(){
    const bladeGeo = new THREE.PlaneGeometry(0.35, 4, 1, 8);
    bladeGeo.translate(0,2,0);
    // taper and wavy
    const pos = bladeGeo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const y=pos.getY(i);
      const taper = 1 - Math.pow(y/4,1.5)*0.6;
      pos.setX(i, pos.getX(i)*taper);
    }
    bladeGeo.computeVertexNormals();

    const offsets=[], scales=[], phases=[], colors=[];
    for(let i=0;i<this.count;i++){
      const ang=Math.random()*Math.PI*2;
      const rad=20+Math.random()*110;
      const x=Math.cos(ang)*rad;
      const z=Math.sin(ang)*rad;
      const y=-1.5 - Math.random()*6;
      offsets.push(x,y,z);
      scales.push(0.6+Math.random()*1.8);
      phases.push(Math.random()*Math.PI*2);
      const c=new THREE.Color().setHSL(0.28+Math.random()*0.12, 0.5+Math.random()*0.3, 0.2+Math.random()*0.2);
      colors.push(c.r,c.g,c.b);
    }

    const instGeo = new THREE.InstancedBufferGeometry();
    instGeo.instanceCount=this.count;
    instGeo.setAttribute('position', bladeGeo.attributes.position);
    instGeo.setAttribute('uv', bladeGeo.attributes.uv);
    instGeo.setAttribute('normal', bladeGeo.attributes.normal);
    instGeo.setIndex(bladeGeo.index);
    instGeo.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(new Float32Array(offsets),3));
    instGeo.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(new Float32Array(scales),1));
    instGeo.setAttribute('instancePhase', new THREE.InstancedBufferAttribute(new Float32Array(phases),1));
    instGeo.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(new Float32Array(colors),3));

    const vert=`
uniform float uTime;
uniform vec3 uCurrentDir;
uniform float uCurrentStrength;
attribute vec3 instanceOffset;
attribute float instanceScale;
attribute float instancePhase;
attribute vec3 instanceColor;
varying vec3 vColor;
varying vec2 vUv;
varying float vDepth;
void main(){
  vUv=uv;
  vColor=instanceColor;
  vec3 pos=position;
  pos.y*=instanceScale;
  float hFactor = pos.y / max(instanceScale*4.0,0.001);
  float sway = sin(uTime*0.6 + instancePhase + hFactor*2.0)*uCurrentStrength*hFactor*1.2;
  float sway2 = cos(uTime*0.4 + instancePhase*1.3)*uCurrentStrength*hFactor*0.6;
  pos.x += uCurrentDir.x*sway + sway2;
  pos.z += uCurrentDir.z*sway;
  // gentle twist
  float twist = hFactor*0.5*sin(uTime*0.3+instancePhase);
  float c=cos(twist), s=sin(twist);
  vec3 twisted = vec3(pos.x*c - pos.z*s, pos.y, pos.x*s + pos.z*c);
  vec3 worldPos = twisted + instanceOffset;
  vDepth = hFactor;
  gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(worldPos,1.0);
}
`;
    const frag=`
varying vec3 vColor;
varying vec2 vUv;
varying float vDepth;
void main(){
  float alpha = smoothstep(0.0,0.1,vUv.y) * (1.0 - smoothstep(0.7,1.0,vUv.y));
  if(alpha<0.1) discard;
  vec3 col = vColor * mix(0.4,1.2,vDepth);
  col += vec3(0.05,0.2,0.1)*pow(vDepth,2.0);
  // fake subsurface
  float sss = pow(vUv.y,2.0)*0.3;
  col += sss*vec3(0.3,0.6,0.2);
  gl_FragColor = vec4(col, alpha*0.9);
}
`;
    const mat=new THREE.ShaderMaterial({
      vertexShader:vert,
      fragmentShader:frag,
      uniforms:this.uniforms,
      transparent:true,
      side:THREE.DoubleSide,
      depthWrite:false,
    });
    this.mesh=new THREE.Mesh(instGeo,mat);
  }

  update(time){
    this.uniforms.uTime.value=time;
  }
}
