/**
 * Boat - 帆船系统
 * 浮力采样 + 自动航行
 */
import * as THREE from 'three';

export function createBoatMesh(){
  const group = new THREE.Group();
  const hullGeo = new THREE.BoxGeometry(4,1.2,10,4,1,6);
  const pos = hullGeo.attributes.position;
  for(let i=0;i<pos.count;i++){
    let x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
    const nz = z/5;
    const taper = 1 - Math.pow(Math.max(0,nz),2)*0.9;
    x *= taper*0.9+0.1;
    if(y<0){ x*=0.7; y*=0.6; }
    y+= Math.cos(nz*1.2)*0.15;
    pos.setXYZ(i,x,y,z);
  }
  hullGeo.computeVertexNormals();
  const hull = new THREE.Mesh(hullGeo, new THREE.MeshStandardMaterial({color:0x8b5a2b, roughness:0.8}));
  hull.castShadow=true; hull.receiveShadow=true;
  group.add(hull);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.2,0.2,7), new THREE.MeshStandardMaterial({color:0xd2b48c}));
  deck.position.set(0,0.7,0); deck.castShadow=true; group.add(deck);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.09,8,8), new THREE.MeshStandardMaterial({color:0x4a3020}));
  mast.position.set(0,4.5,0.5); mast.castShadow=true; group.add(mast);

  const sailGeo = new THREE.PlaneGeometry(3.2,5,2,3);
  sailGeo.translate(0,2.5,0);
  const sPos = sailGeo.attributes.position;
  for(let i=0;i<sPos.count;i++){
    sPos.setZ(i, Math.sin(sPos.getX(i)*0.8)*0.4 + Math.sin(sPos.getY(i)*0.5)*0.2);
  }
  sailGeo.computeVertexNormals();
  const sailMat = new THREE.MeshStandardMaterial({color:0xfffaf0, side:THREE.DoubleSide});
  const sail = new THREE.Mesh(sailGeo, sailMat);
  sail.position.set(0,2,0.6); sail.rotation.y=0.2; sail.castShadow=true;
  group.add(sail);
  const sail2 = sail.clone(); sail2.scale.set(0.7,0.7,0.7); sail2.position.set(0,1.5,-2.2); group.add(sail2);

  return group;
}

export class BoatSystem {
  constructor(ocean){
    this.ocean = ocean;
    this.mesh = createBoatMesh();
    this.mesh.position.set(90,0,40);
    this.velocity = new THREE.Vector3(0.2,0,0.1);
  }

  update(time, dt){
    const tmp={};
    this.ocean.sample(this.mesh.position.x, this.mesh.position.z, time, tmp);
    this.mesh.position.y = tmp.y + 0.6;

    const up = new THREE.Vector3(tmp.nx, tmp.ny, tmp.nz);
    const boatUp = new THREE.Vector3(0,1,0);
    const axis = new THREE.Vector3().crossVectors(boatUp, up).normalize();
    const angle = Math.acos(THREE.MathUtils.clamp(boatUp.dot(up),-1,1));
    if(axis.length()>0.001){
      const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
      this.mesh.quaternion.slerp(q,0.05);
    }

    this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
    this.velocity.x += (Math.random()-0.5)*0.01;
    this.velocity.z += (Math.random()-0.5)*0.01;
    this.velocity.clampLength(0,1.5);
    if(this.mesh.position.length()>300){
      this.velocity.add(new THREE.Vector3().copy(this.mesh.position).negate().normalize().multiplyScalar(0.02));
    }
    const heading = Math.atan2(this.velocity.x, this.velocity.z);
    const hq = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), heading);
    this.mesh.quaternion.slerp(hq,0.02);
  }
}
