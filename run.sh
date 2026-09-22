#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "========================================"
echo " 🌊 OceanUnderwater Photorealistic 2.3"
echo " WebGPU + Three.js + PBR"
echo "========================================"
echo ""

# Check node_modules
if [ ! -f "node_modules/three/build/three.module.js" ]; then
  echo "⚠️  未找到 node_modules，尝试 npm install..."
  if command -v npm &> /dev/null; then
    npm install
  else
    echo "❌ npm 未找到，将使用 CDN 回退（需网络）"
  fi
fi

# Find python
if command -v python3 &> /dev/null; then
  PY=python3
elif command -v python &> /dev/null; then
  PY=python
else
  PY=""
fi

if [ -n "$PY" ]; then
  echo "✅ 使用 $PY"
  echo ""
  echo "启动本地服务器 http://localhost:8000/"
  echo "主场景: http://localhost:8000/index.html"
  echo "WebGPU版: http://localhost:8000/webgpu.html"
  echo "本地兼容版: http://localhost:8000/local.html"
  echo ""
  echo "按 Ctrl+C 停止服务器"
  echo ""
  sleep 1
  if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8000/ &
  elif command -v open &> /dev/null; then
    open http://localhost:8000/ &
  fi
  $PY -m http.server 8000 --bind 127.0.0.1
else
  echo "Python 未找到，尝试 npx serve..."
  if command -v npx &> /dev/null; then
    echo "使用 npx serve 启动..."
    npx serve . -l 8000
  else
    echo "❌ 未找到 python / npx，请安装后重试"
    echo "或直接双击 local.html"
  fi
fi
