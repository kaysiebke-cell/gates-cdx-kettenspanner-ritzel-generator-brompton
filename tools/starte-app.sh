#!/usr/bin/env bash
# Startet FreeCAD und öffnet darin das Bedienfeld "Zahnrad Setup" (freecad/main.py).
MAIN="$(cd "$(dirname "$0")/.." && pwd)/freecad/main.py"
if command -v flatpak >/dev/null && flatpak info org.freecad.FreeCAD >/dev/null 2>&1; then
  exec flatpak run org.freecad.FreeCAD "$MAIN"
fi
for b in freecad FreeCAD; do
  if command -v $b >/dev/null; then exec $b "$MAIN"; fi
done
echo "FreeCAD nicht gefunden" >&2; exit 1
