@echo off
title OceanUnderwater
cd /d %~dp0
echo Starting OceanUnderwater...
echo.

if exist "node_modules\three\build\three.module.js" (
  echo Found local three.js
) else (
  echo node_modules not found, will use CDN fallback
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
echo Or open local.html directly (file:// compatible)
echo.
echo Opening local.html...
start local.html

:end
pause
