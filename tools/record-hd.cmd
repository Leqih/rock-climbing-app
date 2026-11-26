@echo off
rem Double-click to record the Spotter prototype at iPhone 16 Pro resolution (1206 x 2622, 30 fps).
rem Starts the local server if it isn't running, installs the recorder the first time, then opens the app in Chrome.
cd /d "%~dp0.."
curl -s -o nul http://localhost:8000/ || (start "Spotter server" /min python -I serve.py 8000 . & timeout /t 2 >nul)
if not exist "tools\hd-record\node_modules\playwright-core" call npm --prefix tools\hd-record install --no-fund --no-audit
node tools\hd-record\record.js %*
pause
