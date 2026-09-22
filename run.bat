@echo off
chcp 65001 >nul
title OceanUnderwater - Photorealistic Ocean
cd /d %~dp0
echo.
echo ========================================
echo  🌊 OceanUnderwater Photorealistic 2.3
echo  WebGPU + Three.js + PBR
echo ========================================
echo.
echo 正在检测运行环境...

:: Check if node_modules exists
if not exist "node_modules\three\build\three.module.js" (
  echo  ⚠️  未找到 node_modules，尝试 npm install...
  where npm >nul 2>nul
  if %ERRORLEVEL% EQU 0 (
    call npm install
  ) else (
    echo  ❌ npm 未找到，将使用 CDN 回退（需网络）
  )
)

:: Try python
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  set PY=python
  goto :foundpy
)
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  set PY=python3
  goto :foundpy
)

:: No python, try npx
echo  Python 未找到，尝试 npx serve...
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo  使用 npx serve 启动...
  echo  浏览器将打开 http://localhost:8000/
  timeout /t 1 /nobreak >nul
  start http://localhost:8000/
  npx serve . -l 8000
  goto :end
) else (
  echo  ❌ 未找到 python / python3 / npx
  echo  请安装 Python 或 Node.js 后重试
  echo  或直接双击 local.html（file:// 兼容版）
  pause
  exit /b
)

:foundpy
echo  ✅ 使用 %PY%
echo.
echo  启动本地服务器 http://localhost:8000/
echo  主场景: http://localhost:8000/index.html
echo  WebGPU版: http://localhost:8000/webgpu.html
echo  本地兼容版: http://localhost:8000/local.html
echo.
echo  按 Ctrl+C 停止服务器
echo.
timeout /t 1 /nobreak >nul
start http://localhost:8000/
%PY% -m http.server 8000 --bind 127.0.0.1

:end
pause
