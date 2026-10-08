# Projektstruktur

[← Übersicht](../../README.de.md) · [Alle Seiten](../../README.de.md#dokumentation)

---

Eine Codebasis, vier Versionen. Damit nichts durcheinandergerät, hat jede Version ihren Ordner.

| Ordner / Datei | Inhalt |
|---|---|
| `params.json` | **Einzige Quelle** für Eingabefelder, Standardwerte und Grenzen – gelesen von Web und FreeCAD. |
| `web/` | **Web-Version.** Zugleich der Rechenkern für Android-App und Linux-App. |
| `web/js/geometry.js` | Geometrie der Live-Vorschau (Ritzel, Spannrolle). |
| `web/js/csg.js` | Boolesche Operationen mit `manifold-3d` (WebAssembly) – liefert geschlossene Körper. |
| `web/js/step.js` | STEP-Download (fertige Release-ZIP oder Cloud-Bau). |
| `web/js/zahnprofil.js`, `speichen.js` | Gemeinsame Kontur-Mathematik – `npm test` hält sie gleich mit Python. |
| `android/` | **Android-App** (Kotlin-WebView, kopiert `web/` ins App-Paket). |
| `linux/` | **Linux-App** (GTK im Cinnamon-Stil), `bauen-deb.sh` baut das Paket. |
| `linux/freecad-starter/` | Doppelklick-Starter für FreeCAD mit dem Bedienfeld. |
| `freecad/main.py` | **FreeCAD-Version:** Einstiegspunkt, lädt alle Module. |
| `freecad/zahnrad_ui.py` | Das Bedienfeld (Eingaben, Buttons, Speichern der Werte). |
| `freecad/zahnrad_generator.py` | Geometrie: Skizze des Zahnprofils und Aufbau des 3D-Körpers. |
| `freecad/zahnprofil.py`, `speichen_geometrie.py` | Kontur-Mathematik (ohne FreeCAD-Import). |
| `freecad/build_headless.py` | Baut die Release-Serie (STEP/STL) ohne Oberfläche, z. B. in GitHub Actions. |
| `worker/` | STEP-Vermittler (Cloudflare Worker) für den Cloud-Bau mit eigenen Werten. |
| `tools/` | Prüfungen und Hilfen: `golden-test.mjs` (`npm test`), `dicht-test.mjs` (`npm run test:dicht`), `gen-readme.mjs`. |
| `.github/workflows/` | Veröffentlichung der Webseite, Bau der APK, Cloud-Bau, Prüfungen. |
| `bilder/`, `docs/` | Bilder und diese Dokumentation. |

### Eine Quelle statt zwei

Dieselbe Geometrie zweimal zu pflegen – einmal in Python fürs CAD, einmal in JavaScript für die Vorschau – geht auf Dauer schief: der Konfigurator zeigt dann etwas anderes an, als in der STEP-Datei steht. Dagegen stehen hier zwei Vorkehrungen:

* **Parameter gibt es nur einmal.** Eingabefelder, Standardwerte und die Zähnezahl-Grenzen stehen ausschließlich in `params.json`. FreeCAD liest die Datei beim Start, der Web-Generator bekommt sie beim Bauen ins Bundle gelegt. Werte bitte nirgendwo sonst eintragen.
* **Formeln werden nachgerechnet.** Die geteilte Kontur-Mathematik (`zahnprofil`, `speichen_geometrie`/`speichen.js`) liegt in Modulen ohne FreeCAD- und ohne Three.js-Bindung. `npm test` rechnet beide Fassungen für rund 20 Parametersätze durch und vergleicht Radien, Konturpunkte und Speichen-Öffnungen auf ein Nanometer genau. Jede Abweichung bricht den Lauf ab – auch auf jedem Zweig, siehe `.github/workflows/pruefen.yml`.

Gebraucht wird dafür nur `python3` und Node; weder FreeCAD noch Three.js müssen installiert sein.

```
npm test
```
