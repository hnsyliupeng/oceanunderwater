@echo off
title OceanUnderwater 2.5 Offline
cd /d %~dp0
echo Starting OceanUnderwater 2.5 Offline...
echo Pure offline, no CDN needed, vendor/three.module.js
echo.

if exist "vendor\three.module.js" (
  echo Found vendor\three.module.js - offline OK
) else (
  echo vendor not found, please keep vendor folder!
)

echo Trying python...
python -m http.server 8000 --bind 127.0.0.1
if %errorlevel%==0 goto end

echo Trying python3...
python3 -m http.server 8000 --bind 127.0.0.1
if %errorlevel%==0 goto end

echo Trying npx...
npx serve . -l 8000
if %errorlevel%==0 goto end

echo.
echo No python or npx found!
echo Please install Python from https://python.org
echo.

:end
pause
