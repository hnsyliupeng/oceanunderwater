/**
 * OceanUnderwater - 主入口
 * WebGPU 海洋生态库
 * 整合: RealIsland 海洋 + Grass Meadow 草丛 + Jelly Garden 水母
 */
export { Ocean, DEFAULT_WAVES } from './ocean.js';
export { IslandTerrain } from './terrain.js';
export { GrassSystem, FlowerSystem } from './grass.js';
export { RockSystem } from './rocks.js';
export { BoatSystem, createBoatMesh } from './boat.js';
export { BirdFlock, FishSchool, JellyGarden } from './ecosystem.js';
export { PalmSystem } from './trees.js';
export { KelpForest } from './kelp.js';
export { CausticsSystem } from './caustics.js';
export { WakeSystem } from './wake.js';

import { Ocean } from './ocean.js';
import { IslandTerrain } from './terrain.js';
import { GrassSystem, FlowerSystem } from './grass.js';
import { RockSystem } from './rocks.js';
import { BoatSystem } from './boat.js';
import { BirdFlock, FishSchool, JellyGarden } from './ecosystem.js';
import { PalmSystem } from './trees.js';
import { KelpForest } from './kelp.js';
import { CausticsSystem } from './caustics.js';
import { WakeSystem } from './wake.js';

export class OceanWorld {
  constructor(scene, options={}){
    this.scene = scene;
    this.ocean = new Ocean(options.ocean);
    scene.add(this.ocean.mesh);

    this.island = new IslandTerrain(options.island).build();
    scene.add(this.island.mesh);

    this.rocks = new RockSystem(options.rocks);
    scene.add(this.rocks.mesh);

    this.grass = new GrassSystem(this.island.grassSpots, options.grass);
    scene.add(this.grass.mesh);

    this.flowers = new FlowerSystem(this.island.grassSpots, options.flowers);
    this.flowers.addTo(scene);

    this.palms = new PalmSystem(this.island.grassSpots, options.palms ?? {count:60});
    this.palms.addTo(scene);

    this.kelp = new KelpForest(options.kelp ?? {count:350});
    scene.add(this.kelp.mesh);

    this.boat = new BoatSystem(this.ocean);
    scene.add(this.boat.mesh);

    this.wake = new WakeSystem(this.boat, this.ocean);
    scene.add(this.wake.mesh);

    this.caustics = new CausticsSystem();
    scene.add(this.caustics.mesh);

    this.birds = new BirdFlock(options.birdsCount ?? 80);
    scene.add(this.birds.mesh);

    this.fish = new FishSchool(options.fishCount ?? 160);
    scene.add(this.fish.mesh);

    this.jellies = new JellyGarden(options.jellyCount ?? 14);
    this.jellies.addTo(scene);

    this.time = 0;
    this.isUnderwater = false;
  }

  update(dt){
    this.time += dt;
    this.ocean.update(this.time);
    this.grass.update(this.time);
    this.kelp.update(this.time);
    this.boat.update(this.time, dt);
    this.wake.update(this.time, dt);
    this.birds.update(dt, this.time);
    this.fish.update(dt);
    this.jellies.update(dt, this.time);
    this.caustics.update(this.time, this.isUnderwater);
  }

  setWind(v){
    this.ocean.params.wind = v;
    this.grass.setWindStrength(v);
  }

  setWaveScale(v){
    this.ocean.params.waveScale = v;
  }

  setUnderwater(v){
    this.isUnderwater = v;
  }

  sampleOcean(x,z,out){
    return this.ocean.sample(x,z,this.time,out);
  }
}
