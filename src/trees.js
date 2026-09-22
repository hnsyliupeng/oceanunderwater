/**
 * Trees - 棕榈树与灌木
 * 程序化低多边形棕榈
 */
import * as THREE from 'three';

function createPalmGeometry(){
  const group = new THREE.Group();
  // trunk: cylinder with slight curve
  const trunkGeo = new THREE.CylinderGeometry(0.15,0.35,6,6,4);
  const pos = trunkGeo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const y = pos.getY(i);
    const t = (y+3)/6;
    const bend = Math.sin(t*Math.PI*0.5)*0.6;
    pos.setX(i, pos.getX(i)+bend);
  }
  trunkGeo.computeVertexNormals();
  const trunk = new THREE.Mesh(trunkGeo, new THREE.MeshStandardMaterial({color:0x5a3d2a, roughness:0.9}));
  trunk.position.y=3;
  group.add(trunk);

  // leaves: 7 large planes
  const leafGeo = new THREE.PlaneGeometry(0.6,2.5,1,3);
  leafGeo.translate(0,1.25,0);
  const leafPos = leafGeo.attributes.position;
  for(let i=0;i<leafPos.count;i++){
    const y=leafPos.getY(i);
    const curve = Math.pow(y/2.5,2)*0.8;
    leafPos.setZ(i, leafPos.getZ(i)-curve);
  }
  leafGeo.computeVertexNormals();
  const leafMat = new THREE.MeshStandardMaterial({color:0x2e7d32, side:THREE.DoubleSide, roughness:0.8});
  for(let i=0;i<7;i++){
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0,6,0);
    leaf.rotation.y = (i/7)*Math.PI*2;
    leaf.rotation.x = -0.3 - Math.random()*0.3;
    leaf.rotation.z = (Math.random()-0.5)*0.2;
    group.add(leaf);
  }
  // coconuts
  const cocoGeo = new THREE.SphereGeometry(0.18,6,6);
  const cocoMat = new THREE.MeshStandardMaterial({color:0x6d4c41});
  for(let i=0;i<3;i++){
    const coco = new THREE.Mesh(cocoGeo,cocoMat);
    coco.position.set((Math.random()-0.5)*0.6,5.2+Math.random()*0.3,(Math.random()-0.5)*0.6);
    group.add(coco);
  }
  return group;
}

export class PalmSystem {
  constructor(grassSpots, options={}){
    this.count = options.count ?? 80;
    this.spots = grassSpots;
    this.meshes = [];
    this.build();
  }

  build(){
    const template = createPalmGeometry();
    // We'll use InstancedMesh for trunks and leaves separately for performance,
    // but for simplicity use individual Groups with LOD - 80 palms is okay
    // Convert to Instanced: use trunk instanced + leaves instanced
    const trunkGeo = new THREE.CylinderGeometry(0.18,0.32,5.5,6);
    const trunkMat = new THREE.MeshStandardMaterial({color:0x5a3d2a, roughness:0.9});
    this.trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, this.count);
    this.trunkInst.castShadow=true; this.trunkInst.receiveShadow=true;

    const leafGeo = new THREE.PlaneGeometry(0.5,2.2,1,2);
    leafGeo.translate(0,1.1,0);
    const leafMat = new THREE.MeshStandardMaterial({color:0x2e7d32, side:THREE.DoubleSide});
    this.leafInst = new THREE.InstancedMesh(leafGeo, leafMat, this.count*7);

    const dummy = new THREE.Object3D();
    let leafIdx=0;
    let trunkIdx=0;
    for(let i=0;i<this.count*2 && trunkIdx<this.count;i++){
      const spot = this.spots[Math.floor(Math.random()*this.spots.length)];
      if(!spot || spot.y<2 || spot.y>14) continue;
      if(Math.random()<0.88) continue;
      const x = spot.x + (Math.random()-0.5)*6;
      const z = spot.z + (Math.random()-0.5)*6;
      const y = spot.y;
      dummy.position.set(x,y,z);
      dummy.rotation.y = Math.random()*Math.PI*2;
      const s = 0.8+Math.random()*0.6;
      dummy.scale.set(s,s,s);
      dummy.updateMatrix();
      this.trunkInst.setMatrixAt(trunkIdx++, dummy.matrix);

      // 7 leaves per trunk
      for(let l=0;l<7;l++){
        const ld = new THREE.Object3D();
        ld.position.set(x, y+5.5*s, z);
        ld.rotation.y = (l/7)*Math.PI*2 + Math.random()*0.3;
        ld.rotation.x = -0.4 - Math.random()*0.3;
        ld.scale.set(s,s,s);
        ld.updateMatrix();
        this.leafInst.setMatrixAt(leafIdx++, ld.matrix);
      }
    }
    this.trunkInst.instanceMatrix.needsUpdate=true;
    this.leafInst.instanceMatrix.needsUpdate=true;
    this.trunkInst.count = trunkIdx;
    this.leafInst.count = leafIdx;
  }

  addTo(scene){
    scene.add(this.trunkInst);
    scene.add(this.leafInst);
  }
}
