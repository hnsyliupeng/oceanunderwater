/**
 * Ecosystem - 鸟群、鱼群、水母
 * 参考 Grass Meadow 生物行为 + Jelly Luminous Garden 发光水母
 */
import * as THREE from 'three';

class Boid {
  constructor(pos, vel){
    this.pos = pos.clone();
    this.vel = vel.clone();
    this.acc = new THREE.Vector3();
    this.maxSpeed = 8+Math.random()*4;
  }
}

export class BirdFlock {
  constructor(count=80){
    this.count = count;
    this.boids = [];
    for(let i=0;i<count;i++){
      this.boids.push(new Boid(
        new THREE.Vector3((Math.random()-0.5)*400, 25+Math.random()*60, (Math.random()-0.5)*400),
        new THREE.Vector3((Math.random()-0.5)*6, (Math.random()-0.5)*1, (Math.random()-0.5)*6)
      ));
    }
    this.buildMesh();
  }

  buildMesh(){
    const geo = new THREE.BufferGeometry();
    const verts = [0,0,0.3, -0.1,0,-0.2, 0.1,0,-0.2,  0,0,0, -0.6,0,0.1, -0.1,0,-0.1,  0,0,0, 0.1,0,-0.1, 0.6,0,0.1];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts,3));
    geo.computeVertexNormals();

    const phases = new Float32Array(this.count);
    const sizes = new Float32Array(this.count);
    for(let i=0;i<this.count;i++){ phases[i]=Math.random()*Math.PI*2; sizes[i]=0.8+Math.random()*0.6; }
    geo.setAttribute('instancePhase', new THREE.InstancedBufferAttribute(phases,1));
    geo.setAttribute('instanceSize', new THREE.InstancedBufferAttribute(sizes,1));

    const vert = `
uniform float uTime;
attribute float instancePhase;
attribute float instanceSize;
varying vec3 vColor;
void main(){
  vec3 pos = position;
  float flap = sin(uTime*12.0 + instancePhase)*0.9;
  if(pos.x < -0.11){ pos.y += sin(flap)*abs(pos.x)*1.2; }
  else if(pos.x > 0.11){ pos.y += sin(flap)*abs(pos.x)*1.2; }
  pos *= instanceSize;
  vColor = vec3(0.95,0.95,0.96);
  #include <common>
  #include <instance_pars_vertex>
  #include <begin_vertex>
  transformed = pos;
  #include <instance_vertex>
  #include <project_vertex>
}
`;
    const frag = `varying vec3 vColor; void main(){ gl_FragColor=vec4(vColor,1.0); }`;
    const mat = new THREE.ShaderMaterial({vertexShader:vert, fragmentShader:frag, uniforms:{uTime:{value:0}}, side:THREE.DoubleSide});
    this.mesh = new THREE.InstancedMesh(geo, mat, this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.dummy = new THREE.Object3D();
  }

  update(dt, time){
    this.mesh.material.uniforms.uTime.value = time;
    // boids
    const sepD=8, alignD=18, cohD=28;
    for(let i=0;i<this.count;i++){
      const b=this.boids[i];
      const sep=new THREE.Vector3(), align=new THREE.Vector3(), coh=new THREE.Vector3();
      let sc=0, ac=0, cc=0;
      for(let j=0;j<this.count;j++){
        if(i===j) continue;
        const o=this.boids[j];
        const d=b.pos.distanceTo(o.pos);
        if(d<0.01||d>cohD) continue;
        if(d<sepD){ sep.add(new THREE.Vector3().subVectors(b.pos,o.pos).divideScalar(d)); sc++; }
        if(d<alignD){ align.add(o.vel); ac++; }
        if(d<cohD){ coh.add(o.pos); cc++; }
      }
      if(sc>0){ sep.divideScalar(sc).normalize().multiplyScalar(0.9); b.acc.add(sep); }
      if(ac>0){ align.divideScalar(ac).normalize().multiplyScalar(0.6); align.sub(b.vel).clampLength(0,0.08); b.acc.add(align); }
      if(cc>0){ coh.divideScalar(cc).sub(b.pos).normalize().multiplyScalar(0.4); b.acc.add(coh); }
      const distI=Math.hypot(b.pos.x,b.pos.z);
      if(distI<140) b.acc.add(new THREE.Vector3(b.pos.x,0,b.pos.z).normalize().multiplyScalar(0.5));
      b.acc.y += (25+Math.sin(b.pos.x*0.01)*10 - b.pos.y)*0.02;
    }
    for(const b of this.boids){
      b.vel.add(b.acc).clampLength(2,b.maxSpeed);
      b.pos.add(b.vel.clone().multiplyScalar(dt));
      b.acc.set(0,0,0);
    }
    for(let i=0;i<this.count;i++){
      const b=this.boids[i];
      this.dummy.position.copy(b.pos);
      const dir=b.vel.clone().normalize();
      if(dir.length()>0.001){ this.dummy.lookAt(b.pos.clone().add(dir)); this.dummy.rotateX(-Math.PI/2); }
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i,this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate=true;
  }
}

export class FishSchool {
  constructor(count=160){
    this.count=count;
    this.boids=[];
    for(let i=0;i<count;i++){
      const ang=Math.random()*Math.PI*2, rad=40+Math.random()*100;
      this.boids.push({
        pos:new THREE.Vector3(Math.cos(ang)*rad, -3-Math.random()*18, Math.sin(ang)*rad),
        vel:new THREE.Vector3((Math.random()-0.5)*2,(Math.random()-0.5)*0.5,(Math.random()-0.5)*2),
        acc:new THREE.Vector3(),
        color:new THREE.Color().setHSL(0.55+Math.random()*0.15,0.7,0.5+Math.random()*0.2)
      });
    }
    const geo=new THREE.ConeGeometry(0.18,0.9,6); geo.rotateX(-Math.PI/2);
    const mat=new THREE.MeshStandardMaterial({color:0xffffff});
    this.mesh=new THREE.InstancedMesh(geo,mat,count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.dummy=new THREE.Object3D();
  }

  update(dt){
    const sepD=3.5, alignD=7, cohD=10;
    for(let i=0;i<this.count;i++){
      const b=this.boids[i];
      const sep=new THREE.Vector3(), align=new THREE.Vector3(), coh=new THREE.Vector3();
      let sc=0,ac=0,cc=0;
      for(let j=0;j<this.count;j++){
        if(i===j) continue;
        const o=this.boids[j];
        const d=b.pos.distanceTo(o.pos);
        if(d<0.01||d>cohD) continue;
        if(d<sepD){ sep.add(new THREE.Vector3().subVectors(b.pos,o.pos).divideScalar(d)); sc++; }
        if(d<alignD){ align.add(o.vel); ac++; }
        if(d<cohD){ coh.add(o.pos); cc++; }
      }
      if(sc>0){ sep.divideScalar(sc).normalize().multiplyScalar(0.9); b.acc.add(sep); }
      if(ac>0){ align.divideScalar(ac).normalize().multiplyScalar(0.6); align.sub(b.vel).clampLength(0,0.08); b.acc.add(align); }
      if(cc>0){ coh.divideScalar(cc).sub(b.pos).normalize().multiplyScalar(0.4); b.acc.add(coh); }
      if(b.pos.y>-1) b.acc.y-=0.1;
      if(b.pos.y<-22) b.acc.y+=0.05;
      const dI=Math.hypot(b.pos.x,b.pos.z);
      if(dI>150) b.acc.add(new THREE.Vector3(-b.pos.x,0,-b.pos.z).normalize().multiplyScalar(0.2));
      if(dI<20) b.acc.add(new THREE.Vector3(b.pos.x,0,b.pos.z).normalize().multiplyScalar(0.2));
    }
    for(const b of this.boids){
      b.vel.add(b.acc).clampLength(0.5,3.5);
      b.pos.add(b.vel.clone().multiplyScalar(dt));
      b.acc.set(0,0,0);
    }
    for(let i=0;i<this.count;i++){
      const f=this.boids[i];
      this.dummy.position.copy(f.pos);
      const dir=f.vel.clone().normalize();
      if(dir.length()>0.001){ this.dummy.lookAt(f.pos.clone().add(dir)); this.dummy.rotateX(Math.PI/2); }
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i,this.dummy.matrix);
      this.mesh.setColorAt(i,f.color);
    }
    this.mesh.instanceMatrix.needsUpdate=true;
    if(this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate=true;
  }
}

export class JellyGarden {
  constructor(count=14){
    this.count=count;
    this.jellies=[];
    this.build();
  }

  createJellyMesh(color){
    const group=new THREE.Group();
    const bellGeo=new THREE.SphereGeometry(0.9,24,16,0,Math.PI*2,0,Math.PI*0.65);
    const bellPos=bellGeo.attributes.position;
    for(let i=0;i<bellPos.count;i++){ if(bellPos.getY(i)<0) bellPos.setY(i, bellPos.getY(i)*0.4); }
    bellGeo.computeVertexNormals();
    const bellMat=new THREE.ShaderMaterial({
      uniforms:{uTime:{value:0}, uColor:{value:color}},
      vertexShader:`uniform float uTime; varying vec3 vNormal; varying vec3 vPos;
        void main(){ vec3 pos=position; float pulse=sin(uTime*1.1)*0.08+1.0; pos.x*=pulse; pos.z*=pulse; pos.y*=0.9+sin(uTime*1.1)*0.05;
        vNormal=normalize(normalMatrix*normal); vPos=pos; gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0); }`,
      fragmentShader:`uniform vec3 uColor; varying vec3 vNormal; varying vec3 vPos;
        void main(){ float fresnel=pow(1.0-abs(dot(vNormal,vec3(0.0,0.0,1.0))),3.0); vec3 col=uColor+fresnel*vec3(0.8,0.9,1.0)*0.8;
        float inner=1.0-length(vPos.xz)*0.6; col+=inner*0.3*uColor*1.5; float alpha=0.75+fresnel*0.25; gl_FragColor=vec4(col,alpha); }`,
      transparent:true, side:THREE.DoubleSide, depthWrite:false
    });
    const bell=new THREE.Mesh(bellGeo,bellMat);
    group.add(bell);
    const tentacles=[];
    const tCount=8+Math.floor(Math.random()*6);
    for(let i=0;i<tCount;i++){
      const ang=(i/tCount)*Math.PI*2;
      const points=[];
      const len=1.5+Math.random()*2.5;
      for(let j=0;j<12;j++){ const t=j/11; points.push(new THREE.Vector3(Math.cos(ang)*0.4*(1-t*0.3), -t*len, Math.sin(ang)*0.4*(1-t*0.3))); }
      const curve=new THREE.CatmullRomCurve3(points);
      const tubeGeo=new THREE.TubeGeometry(curve,12,0.02,4,false);
      const tubeMat=new THREE.MeshBasicMaterial({color:color.clone().multiplyScalar(0.9), transparent:true, opacity:0.6});
      const tube=new THREE.Mesh(tubeGeo,tubeMat);
      tentacles.push({mesh:tube, phase:Math.random()*Math.PI*2});
      group.add(tube);
    }
    group.userData={bellMat, tentacles, phase:Math.random()*100, color};
    return group;
  }

  build(){
    const colors=[0x7afcff,0xff7ad9,0x8aff7a,0xffd97a,0x7a8aff,0xff7a7a,0xaaffff];
    for(let i=0;i<this.count;i++){
      const col=new THREE.Color(colors[i%colors.length]);
      const jelly=this.createJellyMesh(col);
      const ang=Math.random()*Math.PI*2, rad=20+Math.random()*90;
      jelly.position.set(Math.cos(ang)*rad, -8-Math.random()*16, Math.sin(ang)*rad);
      jelly.rotation.y=Math.random()*Math.PI*2;
      jelly.scale.setScalar(0.8+Math.random()*0.9);
      this.jellies.push({mesh:jelly, vel:new THREE.Vector3((Math.random()-0.5)*0.3,(Math.random()-0.5)*0.2,(Math.random()-0.5)*0.3), baseY:jelly.position.y});
    }
  }

  addTo(scene){ this.jellies.forEach(j=>scene.add(j.mesh)); }

  update(dt,time){
    for(const j of this.jellies){
      j.mesh.position.add(j.vel.clone().multiplyScalar(dt));
      j.mesh.position.y = j.baseY + Math.sin(time*0.6 + j.mesh.userData.phase)*1.2 + Math.sin(time*0.23)*0.5;
      j.vel.y += (Math.random()-0.5)*0.002;
      j.vel.clampLength(0,0.6);
      const dist=Math.hypot(j.mesh.position.x, j.mesh.position.z);
      if(dist>160) j.vel.add(new THREE.Vector3(-j.mesh.position.x,0,-j.mesh.position.z).normalize().multiplyScalar(0.01));
      if(j.mesh.position.y>-2) j.vel.y-=0.02;
      if(j.mesh.position.y<-28) j.vel.y+=0.02;
      j.mesh.userData.bellMat.uniforms.uTime.value = time + j.mesh.userData.phase;
      for(const tent of j.mesh.userData.tentacles){
        tent.mesh.position.x = Math.sin(time*1.2+tent.phase)*0.08;
        tent.mesh.position.z = Math.cos(time*0.9+tent.phase*1.3)*0.05;
      }
    }
  }
}
