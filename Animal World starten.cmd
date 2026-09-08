@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Bitte zuerst Node.js installieren.
  pause
  exit /b 1
)
node scripts\browser.cjs
if errorlevel 1 pause
