# Linux app (GTK, Cinnamon style)

[← Overview](../../README.md) · [All pages](../../README.md#documentation)

---

<img src="../../bilder/ansicht-linux.png" alt="Linux app in Cinnamon style" width="720">

A real **GTK program** for Linux Mint/Cinnamon. Form, tabs and buttons are genuine GTK widgets and follow your system theme (colours, font, light/dark). **No browser**, no address bar, **no Chrome**. Works offline.

- The calculation uses the same logic as the web version. It runs in the background and the interface reads its fields from it. Only the 3D preview is a web view.
- Tabs Sprocket, Idler roller, Print guide · language DE/EN · explanations on/off.
- Downloads (ZIP with STL, STEP) end up in `~/Downloads`.
- A second start brings the existing window to the front.

**Install** (build the package and install it, in the project folder):

```bash
linux/bauen-deb.sh
sudo apt install ./linux/dist/ritzel-generator_*_all.deb
```

Then start "Ritzel-Generator" from the application menu (or `ritzel-generator` in a terminal). Requirements: `python3-gi`, `gir1.2-gtk-3.0`, `gir1.2-webkit2-4.1` (requested by the package).

**Try without installing:**

```bash
npm install && npm run build:shell && npm run build:viewer
python3 linux/ritzel-generator.py
```

More: [`linux/README.md`](../../linux/README.md).
