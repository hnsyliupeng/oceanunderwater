/**
 * Rocks - 程序化岩石
 * 岛屿岩石 + 水下礁石
 */
import * as THREE from 'three';

export class RockSystem {
  constructor(options = {}){
    this.count = options.count ?? 260;
    this.mesh = null;
    this.build();
  }

  build(){
    const baseGeo = new THREE.IcosahedronGeometry(1,1);
    const pos = baseGeo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const n = 0.25*Math.random();
      pos.setX(i, pos.getX(i)+(Math.random()-0.5)*n);
      pos.setY(i, pos.getY(i)+(Math.random()-0.5)*n);
      pos.setZ(i, pos.getZ(i)+(Math.random()-0.5)*n);
    }
    baseGeo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({color:0x6b6d68, roughness:0.95, metalness:0.02});
    const inst = new THREE.InstancedMesh(baseGeo, mat, this.count);
    inst.castShadow=true; inst.receiveShadow=true;
    const dummy = new THREE.Object3D();
    let idx=0;
    for(let i=0;i<this.count;i++){
      const ang = Math.random()*Math.PI*2;
      const rad = 30+Math.random()*90 + (Math.random()<0.3? Math.random()*40:0);
      const x = Math.cos(ang)*rad;
      const z = Math.sin(ang)*rad;
      const r = Math.hypot(x,z);
      let y = r<120 ? Math.max(0,(1-THREE.MathUtils.smoothstep(40,130,r))*18 + Math.random()*2) : -2-Math.random()*8;
      if(r>80 && r<120) y*=0.3;
      if(y>20 && Math.random()<0.7) continue;
      const s = 0.4+Math.random()*1.8 + (r>100? Math.random()*1.2:0);
      dummy.position.set(x,y - s*0.3,z);
      dummy.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
      dummy.scale.set(s,s*0.8,s);
      dummy.updateMatrix();
      inst.setMatrixAt(idx, dummy.matrix);
      inst.setColorAt(idx, new THREE.Color().setHSL(0.08+Math.random()*0.06,0.12,(0.6+Math.random()*0.4)*0.5));
      idx++;
    }
    inst.instanceMatrix.needsUpdate=true;
    if(inst.instanceColor) inst.instanceColor.needsUpdate=true;
    this.mesh = inst;
  }
}
