/**
 * Caustics - 焦散投影
 * 程序化焦散纹理 + 水下光斑投影
 */
import * as THREE from 'three';

export class CausticsSystem {
  constructor(options={}){
    this.size = options.size ?? 512;
    this.canvas = document.createElement('canvas');
    this.canvas.width=this.size;
    this.canvas.height=this.size;
    this.ctx=this.canvas.getContext('2d');
    this.texture=new THREE.CanvasTexture(this.canvas);
    this.texture.wrapS=THREE.RepeatWrapping;
    this.texture.wrapT=THREE.RepeatWrapping;
    this.time=0;

    // projector mesh: large plane just below water for caustics
    const geo=new THREE.PlaneGeometry(400,400,1,1);
    geo.rotateX(-Math.PI/2);
    const mat=new THREE.MeshBasicMaterial({
      map:this.texture,
      transparent:true,
      opacity:0.55,
      blending:THREE.AdditiveBlending,
      depthWrite:false,
    });
    this.mesh=new THREE.Mesh(geo,mat);
    this.mesh.position.y=-0.5;
    this.mesh.visible=false; // only underwater

    this.generate(0);
  }

  // simple caustics via sin interference
  generate(t){
    const ctx=this.ctx;
    const w=this.size, h=this.size;
    const img=ctx.createImageData(w,h);
    const data=img.data;
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const u=x/w*8, v=y/h*8;
        // moving caustics pattern
        const c1=Math.sin(u*2 + t*1.2)*Math.cos(v*2 - t*0.9);
        const c2=Math.sin((u+v)*1.5 + t*0.8)*0.6;
        const c3=Math.sin(Math.hypot(u-4,v-4)*3 - t*1.5)*0.5;
        let c=c1+c2+c3;
        c=Math.pow(Math.abs(c),2.5);
        c=Math.min(1,c*1.8);
        // color: cyan tint
        const idx=(y*w+x)*4;
        data[idx]=c*80;
        data[idx+1]=c*200;
        data[idx+2]=c*255;
        data[idx+3]=c*255;
      }
    }
    ctx.putImageData(img,0,0);
    this.texture.needsUpdate=true;
    // animate uv
    this.mesh.material.map.offset.set(t*0.02, t*0.015);
  }

  update(time, isUnderwater){
    this.time=time;
    if(time%0.08<0.02) this.generate(time);
    this.mesh.visible=isUnderwater;
    this.mesh.material.opacity = isUnderwater ? 0.35+Math.sin(time*2)*0.1 : 0;
  }
}
