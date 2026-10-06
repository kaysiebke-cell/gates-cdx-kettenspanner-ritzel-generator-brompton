# Linux-App

Eigenständige Linux-Anwendung: eigenes Fenster (GTK + WebKitGTK), kein Browser,
läuft offline. Zeigt dieselbe Oberfläche wie `../web/`, liefert sie aber
selbst lokal aus. Downloads landen in `~/Downloads`.

| Datei | Inhalt |
|---|---|
| `ritzel-generator.py` | Die Anwendung |
| `bauen-deb.sh` | Baut das Paket `dist/ritzel-generator_<version>_all.deb` |
| `freecad-starter/` | Doppelklick-Starter für die FreeCAD-Version (`../freecad/`) |

## Bauen und installieren

```bash
linux/bauen-deb.sh
sudo apt install ./linux/dist/ritzel-generator_*_all.deb
```

Danach „Ritzel-Generator“ im Anwendungsmenü starten (oder `ritzel-generator`).

## Ohne Installation ausprobieren

```bash
npm run build:shell && npm run build:viewer
python3 linux/ritzel-generator.py
```

Braucht `python3-gi`, `gir1.2-gtk-3.0` und `gir1.2-webkit2-4.1`.
