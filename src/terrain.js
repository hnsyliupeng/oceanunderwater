/**
 * Island terrain - 程序化岛屿地形
 * 参考 RealIsland coastal-noise + hydrology
 */
import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

export class IslandTerrain {
  constructor(options = {}){
    this.size = options.size ?? 260;
    this.res = options.res ?? 160;
    this.noise = new ImprovedNoise();
    this.seed = Math.random()*100;
    this.grassSpots = [];
  }

  fbm(x,y,oct=4){
    let v=0, a=0.5, f=1, max=0;
    for(let i=0;i<oct;i++){
      v+= this.noise.noise(x*f+this.seed, y*f, 0)*a;
      max+=a; a*=0.5; f*=2;
    }
    return v/max;
  }

  build(){
    const geo = new THREE.PlaneGeometry(this.size, this.size, this.res, this.res);
    geo.rotateX(-Math.PI/2);
    const pos = geo.attributes.position;
    const colors = [];
    this.grassSpots = [];

    for(let i=0;i<pos.count;i++){
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.hypot(x,z);
      let shape = 1 - THREE.MathUtils.smoothstep(40, 130, r);
      shape *= THREE.MathUtils.smoothstep(0, 20, r+5);
      shape += this.fbm(x*0.02, z*0.02, 3)*0.06;
      shape = THREE.MathUtils.clamp(shape,0,1);

      let h = Math.pow(shape,0.8)*28;
      h += (Math.sin(x*0.03)*Math.cos(z*0.03)*0.5+0.5)*shape*6;
      h += this.fbm(x*0.05, z*0.05,4)*4*shape;
      h += this.fbm(x*0.12, z*0.12,2)*1.2*shape;
      const beach = THREE.MathUtils.smoothstep(70,110,r);
      if(beach<1) h *= (0.1+beach*0.9);
      if(r>115) h = THREE.MathUtils.lerp(h, -1.5, THREE.MathUtils.smoothstep(115,135,r));

      pos.setY(i,h);

      let col;
      if(h<0.2) col = new THREE.Color(0xc9b896).lerp(new THREE.Color(0xe6d5b8), THREE.MathUtils.clamp((h+1.5)/1.5,0,1));
      else if(h<2.5) col = new THREE.Color(0x6a8a3a).lerp(new THREE.Color(0x8fb359), (h-0.2)/2.3);
      else if(h<12) col = new THREE.Color(0x3d6b2a).lerp(new THREE.Color(0x5a8a3a), (h-2.5)/9.5);
      else if(h<20) col = new THREE.Color(0x4a5a3a).lerp(new THREE.Color(0x7a7a6a), (h-12)/8);
      else col = new THREE.Color(0x8a8a85).lerp(new THREE.Color(0xe8e8e6), THREE.MathUtils.clamp((h-20)/10,0,1));

      const varN = this.fbm(x*0.1,z*0.1,2)*0.15;
      col.offsetHSL(varN*0.1, varN*0.1, varN*0.15);
      colors.push(col.r,col.g,col.b);

      if(h>0.5 && h<18 && r<115 && Math.random()<0.6){
        this.grassSpots.push({x,z,y:h,r});
      }
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors,3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.9, metalness:0.05});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    this.geometry = geo;
    this.material = mat;
    this.mesh = mesh;
    return this;
  }
}
