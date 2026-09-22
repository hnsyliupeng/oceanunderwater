/**
 * Wake - 帆船尾迹
 * 粒子系统 + 泡沫条带
 */
import * as THREE from 'three';

export class WakeSystem {
  constructor(boat, ocean){
    this.boat=boat;
    this.ocean=ocean;
    this.maxParticles=300;
    this.particles=[];
    this.geometry=new THREE.BufferGeometry();
    const pos=new Float32Array(this.maxParticles*3);
    const size=new Float32Array(this.maxParticles);
    const alpha=new Float32Array(this.maxParticles);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos,3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(size,1));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(alpha,1));
    const vert=`
attribute float size;
attribute float alpha;
varying float vAlpha;
void main(){
  vAlpha=alpha;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
  gl_PointSize=size*(400.0/-mvPosition.z);
  gl_Position=projectionMatrix*mvPosition;
}
`;
    const frag=`
varying float vAlpha;
void main(){
  float d=distance(gl_PointCoord, vec2(0.5));
  if(d>0.5) discard;
  float a=vAlpha*(1.0-d*2.0);
  gl_FragColor=vec4(0.95,0.98,1.0,a);
}
`;
    const mat=new THREE.ShaderMaterial({
      vertexShader:vert,
      fragmentShader:frag,
      transparent:true,
      depthWrite:false,
      blending:THREE.AdditiveBlending,
    });
    this.mesh=new THREE.Points(this.geometry,mat);
    this.time=0;
  }

  update(time, dt){
    this.time=time;
    // emit
    if(this.boat.mesh){
      const speed=this.boat.velocity.length();
      if(speed>0.1 && Math.random()<0.6){
        const p={
          pos:this.boat.mesh.position.clone().add(new THREE.Vector3((Math.random()-0.5)*1.5,0.1,-4+Math.random()*0.5).applyQuaternion(this.boat.mesh.quaternion)),
          vel:new THREE.Vector3((Math.random()-0.5)*0.3,0,(Math.random()-0.5)*0.3),
          age:0,
          life:3+Math.random()*3,
          size:0.4+Math.random()*0.8,
        };
        this.particles.push(p);
        if(this.particles.length>this.maxParticles) this.particles.shift();
      }
    }
    // update
    const posAttr=this.geometry.attributes.position;
    const sizeAttr=this.geometry.attributes.size;
    const alphaAttr=this.geometry.attributes.alpha;
    for(let i=0;i<this.maxParticles;i++){
      if(i<this.particles.length){
        const p=this.particles[i];
        p.age+=dt;
        p.pos.add(p.vel.clone().multiplyScalar(dt));
        // sample ocean for y
        const tmp={}; this.ocean.sample(p.pos.x,p.pos.z,time,tmp);
        p.pos.y=tmp.y+0.05;
        p.vel.multiplyScalar(0.98);
        posAttr.setXYZ(i,p.pos.x,p.pos.y,p.pos.z);
        sizeAttr.setX(i, p.size*(1-p.age/p.life));
        alphaAttr.setX(i, (1-p.age/p.life)*0.6);
        if(p.age>p.life){
          this.particles.splice(i,1);
          i--;
        }
      }else{
        posAttr.setXYZ(i,0,-1000,0);
        sizeAttr.setX(i,0);
        alphaAttr.setX(i,0);
      }
    }
    posAttr.needsUpdate=true;
    sizeAttr.needsUpdate=true;
    alphaAttr.needsUpdate=true;
  }
}
