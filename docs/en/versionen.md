# The four versions compared

[← Overview](../../README.md) · [All pages](../../README.md#documentation)

---

All four versions produce the same sprocket. They differ in **where they run** and **what they export**.

| | Web | Linux app | Android app | FreeCAD |
|---|---|---|---|---|
| Runs in | Browser (Chrome, Firefox, …) | Own GTK window in Cinnamon style, **no browser** | Phone, Android app | FreeCAD (e.g. Flatpak) |
| Installation | none | `.deb` package | APK | copy a folder |
| Works offline | partly (after the first visit, service worker) | yes | yes | yes |
| 3D preview | yes | yes | yes | in the FreeCAD window |
| Fillets | approximated | approximated | approximated | **exact (CAD)** |
| STL export | yes (ZIP with guard) | yes | yes | yes (via "Fertigteil") |
| STEP export | yes: ready-made files for 12–19 teeth, custom values via cloud build (about 2–3 min.) | as web | **no** (needs a CAD program anyway) | yes (via "Fertigteil") |
| Belt guide Ø `0` | automatic | automatic | automatic | automatic |
| Belt guide width `0` | no ring | no ring | no ring | no ring |

**Which version fits?**

- Try it quickly, install nothing → **Web**.
- Work at the computer, without a browser and offline → **Linux app**.
- On the go, offline → **Android app**.
- Exact fillets, your own changes to the body, STEP straight from CAD → **FreeCAD**.

The web version, the Android app and the Linux app share **the same calculation core** (`web/`). A change there affects all three. FreeCAD has its own Python code; only `params.json` is shared.
