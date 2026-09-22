# OceanUnderwater 🌊 — WebGPU 海洋生态 2.0

> 参考 **RealIsland** 海岸模拟 + **Grass Meadow** 风场草丛 + **Jelly Luminous Garden** 发光水母，构建的完整 WebGPU 海洋场景库与应用。

**在线演示**: `index.html` (增强版 2.0) — 单文件 + 模块化库混合，WebGPU 自动检测回退 WebGL2 + Bloom辉光

## ✨ 2.0 新增

- **棕榈树** 60棵实例化 (树干+7叶片)
- **海带森林** 350株水下实例化，洋流摆动
- **帆船尾迹** 300粒子泡沫轨迹
- **焦散投影** 程序化 CanvasTexture 动画，潜水时可见
- **灯塔** 山顶 + 旋转探照灯 + 脉动光源
- **Bloom 辉光** (UnrealBloomPass) 针对水母发光
- **小地图** 实时鸟瞰：船、相机、鱼群、鸟群、水母
- **自动昼夜循环** + 截图功能
- **5种相机模式**：环绕 / 跟随帆船 / 潜水 / 鸟瞰 / 水母巢穴

## 特性总览

### 🌊 海洋 (RealIsland 重构)
- Gerstner 8波叠加，CPU/GPU 同步采样
- 法线重构 + Jacobian泡沫 + SSS + Fresnel + 浅滩/深海混合
- WebGPU `WebGPURenderer` 检测

### 🌿 陆地生态
- **岛屿**: fBM噪声 + 海岸侵蚀 + 沙→草→岩→雪渐变
- **草**: 50K叶片实例化 + 风场 `pow(y,2)` 弯折
- **花**: 4K实例化，7色
- **岩石**: 260块变形二十面体
- **棕榈**: 60棵，树干+叶片实例化

### 🌊 水下
- **海带森林**: 350株，洋流摆动着色器
- **焦散**: 程序化 sin 干涉纹理，`CanvasTexture` 动画
- **气泡**: 800点上升循环
- **体积雾**: 潜水自动切换

### ⛵ 船只
- 程序化帆船 + 浮力采样 + 尾迹粒子
- 自动漂流与边界回拉

### 🕊️ 生物 Boids
- 鸟 80 + 鱼 160 + 水母 14
- 水母：钟形体脉动 + 触手 sway + 发光

## 库结构

```
src/
  ocean.js      # 海洋 + 采样
  terrain.js    # 岛屿地形
  grass.js      # 草 + 花
  rocks.js      # 岩石
  trees.js      # 棕榈 (新增)
  kelp.js       # 海带森林 (新增)
  caustics.js   # 焦散 (新增)
  wake.js       # 尾迹 (新增)
  boat.js       # 帆船
  ecosystem.js  # 鸟鱼水母
  index.js      # OceanWorld 整合
```

### 快速使用

```js
import { OceanWorld } from './src/index.js';
const world = new OceanWorld(scene, {
  ocean:{size:1000,res:256},
  grass:{count:50000},
  palms:{count:60},
  kelp:{count:350},
  birdsCount:80, fishCount:160, jellyCount:14
});
function animate(dt){ world.update(dt); }
```

## 演示

- `index.html` — 完整增强版 (推荐)
- `demo.html` — 模块化库精简版
- `webgpu-compute.html` — (计划) 纯 WebGPU Compute 海洋

## 控制

- `WASD` 移动, `Shift` 加速, `空格/C` 升降, 拖拽环视
- 模式：环绕 / 帆船 / 潜水 / 鸟瞰 / 水母
- 滑杆：风、浪、时间；按钮：自动昼夜
- 生态开关：草/棕榈/海带/花/岩石/船/鸟/鱼/水母/焦散/辉光/线框
- 📸 截图

## 技术

- 海洋顶点着色器硬编码 8波，性能优先
- 草/海带：`instanceOffset/Scale/Rot/Phase/Color` + 风/洋流
- 鸟：InstancedMesh + `instancePhase/Size` + 扑动
- 水母：ShaderMaterial + TubeGeometry 触手
- 后处理：EffectComposer + UnrealBloomPass (WebGL)，WebGPU 时禁用以保持兼容
- 小地图：2D Canvas 实时绘制

## 参考

- https://github.com/SamG-Coder/RealIsland
- https://grass-world-meadow.netlify.app
- https://jellys-luminous-garden.netlify.app/

MIT
