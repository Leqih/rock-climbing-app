#!/bin/bash
# Mac: double-click to record just the phone screen, sharp (1206 x 2622, 60 fps), with no mouse arrow: only the grey tap circle.
# (The same as record-phone.cmd on Windows.) A Mac's own screen recording can only be as sharp as the screen it films;
# this one renders the phone at 3x whatever the screen. The first time it needs Node, ffmpeg and Google Chrome:
#   brew install node ffmpeg
# If double-clicking says it can't be opened: run  chmod +x tools/record-phone.command  once, or  bash tools/record-phone.command
cd "$(dirname "$0")/.." || exit 1
if ! curl -s -o /dev/null http://localhost:8000/; then
  python3 -I serve.py 8000 . >/dev/null 2>&1 &
  sleep 2
fi
command -v node >/dev/null || { echo "Node is missing: brew install node"; read -r -p "Press Return to close"; exit 1; }
[ -d tools/hd-record/node_modules/playwright-core ] || npm --prefix tools/hd-record install --no-fund --no-audit
node tools/hd-record/record.js --plain "$@"
read -r -p "Press Return to close"
