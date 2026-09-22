# OceanUnderwater 本地一键运行

## Windows 双击直接运行（推荐）

1. 双击 `run.bat`
   - 自动检测 python / python3 / npx
   - 自动 `npm install`（若无 node_modules）
   - 自动打开浏览器 http://localhost:8000/
   - 按 Ctrl+C 停止

2. 若 `run.bat` 失败，直接双击 `local.html`
   - 纯 UMD 版，支持 file:// 协议，无需服务器
   - PBR 海洋 + 岛屿 + 草 + 鱼 + 水母

## Mac / Linux

```bash
chmod +x run.sh
./run.sh
# 或
python3 -m http.server 8000
# 打开 http://localhost:8000/
```

## 入口说明

| 文件 | 说明 | 协议 | WebGPU |
|------|------|------|--------|
| `index.html` | 主版 Photorealistic 2.3 PBR，50K草+花+棕榈+海带+帆船+鱼鸟水母+焦散气泡+SSAO+Bloom，本地优先→CDN回退 | http:// | 检测徽标，WebGL2 PBR |
| `webgpu.html` | **WebGPU 原生版**，使用 `WebGPURenderer` + CPU Gerstner，WebGPU优先自动回退 WebGL2 | http:// | ✅ WebGPU |
| `local.html` | UMD 兼容版，支持 file:// 双击，无 importmap | file:// + http:// | WebGL2 |
| `simple.html` | 2D 测试，必定显示 | file:// + http:// | 无 |
| `index-cdn.html` | CDN 版，无需 node_modules | http:// | WebGL2 |

## WebGPU 要求

- Chrome 113+ / Edge 113+ / Chrome Canary
- 开启硬件加速
- `chrome://flags` 确保 WebGPU Enabled
- 访问 `webgpu.html` 查看徽标是否显示 WebGPU ✓

## 常见问题

**卡在“初始化...”或“模块未执行”**
- 不要 file:// 双击 `index.html`，必须 http 服务器
- 使用 `run.bat` 或 `python3 -m http.server 8000`
- 或直接双击 `local.html`

**node_modules 404**
- 运行 `npm install` 或 `npm install three`
- 或使用 CDN 版 `index-cdn.html`（需网络）

**白屏 / 黑屏**
- F12 看 Console
- 确保 three.module.js 200 OK
- 尝试降低草数量（编辑 GRASS_COUNT）

## 技术栈

- Three.js 0.160.0 WebGL2 + WebGPU
- Gerstner 波 4波叠加 + Fresnel Schlick IOR 1.33 + GGX + SSS
- 纹理溅射 + 法线贴图 + 焦散
- Instanced 植被 + 棕榈 + 海带森林
- PBR 帆船 clearcoat + transmission
- 鱼 iridescence + 水母 transmission + emissive
- SSAO + Bloom + FogExp2 水下体积雾
