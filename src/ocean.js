/**
 * OceanUnderwater - Ocean module
 * 参考 RealIsland 海岸模拟 / Tessendorf Gerstner Waves
 * WebGPU + WebGL2 兼容的海洋库
 * 提供: Gerstner波浪采样、法线重构、泡沫因子、ShaderMaterial
 */
import * as THREE from 'three';

export const DEFAULT_WAVES = [
  { dir: [1, 0.3], amp: 1.8, freq: 0.09, speed: 1.4, steep: 0.18 },
  { dir: [-0.7, 0.8], amp: 1.2, freq: 0.13, speed: 1.1, steep: 0.15 },
  { dir: [0.2, -1], amp: 0.8, freq: 0.18, speed: 0.9, steep: 0.12 },
  { dir: [0.9, 0.6], amp: 0.5, freq: 0.25, speed: 1.2, steep: 0.1 },
  { dir: [-0.3, -0.9], amp: 0.35, freq: 0.32, speed: 0.8, steep: 0.08 },
  { dir: [0.6, -0.4], amp: 0.25, freq: 0.45, speed: 0.7, steep: 0.06 },
  { dir: [1, 1], amp: 0.18, freq: 0.6, speed: 0.6, steep: 0.05 },
  { dir: [-1, 0.2], amp: 0.12, freq: 0.8, speed: 0.5, steep: 0.04 },
];

function normalize2(v){
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0]/l, v[1]/l];
}

export class Ocean {
  constructor(options = {}){
    this.size = options.size ?? 1200;
    this.res = options.res ?? 320;
    this.waves = (options.waves ?? DEFAULT_WAVES).map(w=>({...w, dir: normalize2(w.dir)}));
    this.params = {
      time: 0,
      wind: options.wind ?? 0.85,
      waveScale: options.waveScale ?? 1.0,
      waveChop: options.waveChop ?? 1.2,
    };
    this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.res, this.res);
    this.geometry.rotateX(-Math.PI/2);

    this.uniforms = {
      uTime: { value: 0 },
      uWind: { value: this.params.wind },
      uWaveScale: { value: this.params.waveScale },
      uSunDir: { value: new THREE.Vector3(300,400,100).normalize() },
      uSunColor: { value: new THREE.Color(0xfff0d0) },
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader: Ocean.vertexShader(),
      fragmentShader: Ocean.fragmentShader(),
      uniforms: this.uniforms,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
  }

  static vertexShader(){
    return `
uniform float uTime;
uniform float uWind;
uniform float uWaveScale;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vFoam;
varying float vHeight;
varying vec2 vUvOcean;
void main(){
  vec3 pos = position;
  vec2 worldXZ = pos.xz;
  float time = uTime;
  float ws = uWaveScale;
  float wind = uWind;
  vec3 disp = vec3(0.0);
  float dYdx = 0.0;
  float dYdz = 0.0;
  float dXdx = 1.0;
  float dZdz = 1.0;
  float dXdz = 0.0;
  float dZdx = 0.0;
  #define WAVE(dirX,dirY,amp,freq,speed,steep) { \
    vec2 dir = normalize(vec2(dirX,dirY)); \
    float A = amp*ws*(0.6+wind*0.5); \
    float k = freq*ws; \
    float c = speed*(1.0+wind*0.2); \
    float Q = steep*wind*1.2; \
    float ph = k*dot(dir, worldXZ) - c*time; \
    float s = sin(ph); float cc = cos(ph); \
    disp.x += Q*A*dir.x*cc; disp.z += Q*A*dir.y*cc; disp.y += A*s; \
    float kA = k*A; dYdx += kA*dir.x*cc; dYdz += kA*dir.y*cc; \
    dXdx += -Q*A*dir.x*dir.x*k*s; dZdz += -Q*A*dir.y*dir.y*k*s; \
    float cross_ = -Q*A*dir.x*dir.y*k*s; dXdz += cross_; dZdx += cross_; \
  }
  WAVE(1.0,0.3,1.8,0.09,1.4,0.18)
  WAVE(-0.7,0.8,1.2,0.13,1.1,0.15)
  WAVE(0.2,-1.0,0.8,0.18,0.9,0.12)
  WAVE(0.9,0.6,0.5,0.25,1.2,0.1)
  WAVE(-0.3,-0.9,0.35,0.32,0.8,0.08)
  WAVE(0.6,-0.4,0.25,0.45,0.7,0.06)
  WAVE(1.0,1.0,0.18,0.6,0.6,0.05)
  WAVE(-1.0,0.2,0.12,0.8,0.5,0.04)
  #undef WAVE
  vec3 newPos = pos + disp;
  vWorldPos = (modelMatrix * vec4(newPos,1.0)).xyz;
  vHeight = disp.y;
  float J = dXdx*dZdz - dXdz*dZdx;
  vFoam = clamp(1.0 - J, 0.0, 1.0);
  vFoam += smoothstep(1.2, 2.2, disp.y) * 0.6;
  vec3 n = normalize(vec3(-dYdx, 1.0, -dYdz));
  vNormalW = normalize(mat3(modelMatrix) * n);
  vViewDir = normalize(cameraPosition - vWorldPos);
  vUvOcean = worldXZ * 0.008 + time*0.02;
  gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPos,1.0);
}
`;
  }

  static fragmentShader(){
    return `
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uWind;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vFoam;
varying float vHeight;
varying vec2 vUvOcean;
float fresnelSchlick(float cosTheta, float F0){ return F0 + (1.0-F0)*pow(clamp(1.0-cosTheta,0.0,1.0),5.0); }
void main(){
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(vViewDir);
  vec3 L = normalize(uSunDir);
  vec3 H = normalize(L+V);
  vec3 deepColor = vec3(0.02,0.12,0.28);
  vec3 shallowColor = vec3(0.06,0.45,0.65);
  vec3 scatteringColor = vec3(0.15,0.75,0.85);
  float depthFactor = clamp((vWorldPos.y+2.0)*0.2 + 0.3, 0.0,1.0);
  float distIsland = length(vWorldPos.xz);
  float islandMask = smoothstep(180.0, 80.0, distIsland);
  vec3 baseColor = mix(deepColor, shallowColor, clamp(depthFactor + islandMask*0.6,0.0,1.0));
  float NdotL = clamp(dot(N,L),0.0,1.0);
  float diff = pow(NdotL, 0.8);
  float NdotH = clamp(dot(N,H),0.0,1.0);
  float spec = pow(NdotH, 120.0) * 2.0 + pow(NdotH, 600.0) * 3.0;
  float F = fresnelSchlick(max(dot(N,V),0.0), 0.02);
  F = mix(F, 0.9, 0.2);
  float sss = pow(clamp(dot(V, -L)*0.5+0.5,0.0,1.0), 3.0) * clamp(vHeight*0.3,0.0,1.0);
  vec3 sssColor = scatteringColor * sss * 0.8;
  float foam = smoothstep(0.35, 0.85, vFoam);
  foam *= smoothstep(0.2, 0.8, vHeight*0.3 + 0.2);
  float foamNoise = fract(sin(dot(vUvOcean*120.0, vec2(12.9898,78.233))) * 43758.5453);
  foam *= 0.7 + foamNoise*0.5;
  vec3 foamColor = vec3(0.95,0.98,1.0);
  vec3 color = baseColor * (0.3 + diff*0.7);
  color += sssColor;
  color = mix(color, foamColor, foam);
  color += spec * uSunColor * (0.6 + F*0.8);
  vec3 skyCol = vec3(0.35,0.65,0.92);
  float viewDist = length(vWorldPos.xz - cameraPosition.xz);
  float fog = 1.0 - exp(-viewDist*0.0008);
  color = mix(color, skyCol, fog*0.35);
  color = mix(color, skyCol*1.2, F*0.35);
  color = mix(color, color*0.9, clamp(length(vWorldPos.xz)*0.0004,0.0,0.5));
  gl_FragColor = vec4(color, 1.0);
}
`;
  }

  sample(x,z,time,out={}){
    let dispX=0, dispY=0, dispZ=0;
    let ddx=0, ddz=0, ddxZ=0, ddzX=0;
    let dYdx=0, dYdz=0;
    const ws = this.params.waveScale;
    const chop = this.params.wind * this.params.waveChop;
    for(const w of this.waves){
      const k = w.freq * ws;
      const c = w.speed * (1+ this.params.wind*0.2);
      const A = w.amp * ws * (0.6 + this.params.wind*0.5);
      const phase = k*(w.dir[0]*x + w.dir[1]*z) - c*time;
      const sinP = Math.sin(phase), cosP = Math.cos(phase);
      const Q = w.steep * chop;
      dispX += Q * A * w.dir[0] * cosP;
      dispZ += Q * A * w.dir[1] * cosP;
      dispY += A * sinP;
      const kA = k*A;
      ddx += -Q * A * w.dir[0]*w.dir[0] * k * sinP;
      ddz += -Q * A * w.dir[1]*w.dir[1] * k * sinP;
      const cross = -Q*A*w.dir[0]*w.dir[1]*k*sinP;
      ddxZ += cross; ddzX += cross;
      dYdx += kA * w.dir[0]*cosP;
      dYdz += kA * w.dir[1]*cosP;
    }
    out.x = x + dispX;
    out.y = dispY;
    out.z = z + dispZ;
    const nx = -dYdx, nz = -dYdz, ny=1;
    const len = Math.hypot(nx,ny,nz);
    out.nx = nx/len; out.ny = ny/len; out.nz = nz/len;
    const J = (1+ddx)*(1+ddz) - ddxZ*ddzX;
    out.jacobian = J;
    out.foam = THREE.MathUtils.clamp(1-J,0,1);
    return out;
  }

  update(time){
    this.params.time = time;
    this.uniforms.uTime.value = time;
    this.uniforms.uWind.value = this.params.wind;
    this.uniforms.uWaveScale.value = this.params.waveScale;
  }

  setSunDirection(dir){
    this.uniforms.uSunDir.value.copy(dir.clone().normalize());
  }
}
