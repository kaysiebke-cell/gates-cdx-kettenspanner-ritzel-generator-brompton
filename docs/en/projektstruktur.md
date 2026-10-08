# Project structure

[← Overview](../../README.md) · [All pages](../../README.md#documentation)

---

One code base, four versions. To keep them apart, each version has its own folder.

| Folder / file | Contents |
|---|---|
| `params.json` | **Single source** for input fields, default values and limits – read by web and FreeCAD. |
| `web/` | **Web version.** Also the calculation core for the Android app and the Linux app. |
| `web/js/geometry.js` | Geometry of the live preview (sprocket, tensioner roller). |
| `web/js/csg.js` | Boolean operations with `manifold-3d` (WebAssembly) – produces closed solids. |
| `web/js/step.js` | STEP download (ready-made release ZIP or cloud build). |
| `web/js/zahnprofil.js`, `speichen.js` | Shared contour math – `npm test` keeps it identical to the Python side. |
| `android/` | **Android app** (Kotlin WebView, copies `web/` into the app package). |
| `linux/` | **Linux app** (GTK, Cinnamon style); `bauen-deb.sh` builds the package. |
| `linux/freecad-starter/` | Double-click launcher for FreeCAD with the panel. |
| `freecad/main.py` | **FreeCAD version:** entry point, loads all modules. |
| `freecad/zahnrad_ui.py` | The panel (inputs, buttons, saving of values). |
| `freecad/zahnrad_generator.py` | Geometry: tooth profile sketch and build-up of the 3D body. |
| `freecad/zahnprofil.py`, `speichen_geometrie.py` | Contour math (no FreeCAD import). |
| `freecad/build_headless.py` | Builds the release series (STEP/STL) without a GUI, e.g. in GitHub Actions. |
| `worker/` | STEP relay (Cloudflare Worker) for the cloud build with custom values. |
| `tools/` | Checks and helpers: `golden-test.mjs` (`npm test`), `dicht-test.mjs` (`npm run test:dicht`), `gen-readme.mjs`. |
| `.github/workflows/` | Publishing the web page, building the APK, cloud build, checks. |
| `bilder/`, `docs/` | Images and this documentation. |

### One source, not two

Maintaining the same geometry twice – once in Python for CAD, once in JavaScript for the preview – goes wrong sooner or later: the configurator then shows something other than what the STEP file contains. Two things guard against that:

* **Parameters exist only once.** Input fields, default values and the tooth-count limits live solely in `params.json`. FreeCAD reads the file at startup; the web generator gets it inlined into its bundle at build time. Do not enter values anywhere else.
* **Formulas are cross-checked.** The shared contour maths (`zahnprofil`, `speichen_geometrie`/`speichen.js`) sits in modules with no FreeCAD and no Three.js binding. `npm test` runs both versions over some 20 parameter sets and compares radii, contour points and spoke openings to within a nanometre. Any difference fails the run – on every branch, too, see `.github/workflows/pruefen.yml`.

All it needs is `python3` and Node; neither FreeCAD nor Three.js has to be installed.

```
npm test
```
