# Linux-App

> **GTK im Cinnamon-Stil, nicht Chrome.** Chrome ist nur für die Web-Version (`../web/`) zuständig. Diese
> Anwendung öffnet kein Chrome-Fenster, keinen `localhost`-Link und keine installierte Chrome-Web-App.

Echtes GTK-Programm im Systemdesign (Cinnamon/Mint): Formular, Reiter und
Knöpfe sind GTK-Bausteine, kein Browser, läuft offline. Gerechnet wird mit
der Logik aus `../web/`: sie läuft im Hintergrund, die Oberfläche liest die
Felder daraus aus und schreibt Änderungen zurück. Nur die 3D-Vorschau ist eine
WebView. Dieselbe Bauweise wie `linux-native/` der Schreibhilfe. Downloads
landen in `~/Downloads`.

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
