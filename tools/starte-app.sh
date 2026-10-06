#!/usr/bin/env bash
# Startet den Ritzel-Generator lokal und öffnet ihn als eigenes App-Fenster.
cd "$(dirname "$0")/.." || exit 1
PORT=8765
if ! (echo > /dev/tcp/127.0.0.1/$PORT) 2>/dev/null; then
  python3 tools/dev-server.py $PORT >/dev/null 2>&1 &
  sleep 1
fi
URL="http://localhost:$PORT/"
for b in google-chrome chromium chromium-browser; do
  if command -v $b >/dev/null; then exec $b --app="$URL"; fi
done
exec xdg-open "$URL"
