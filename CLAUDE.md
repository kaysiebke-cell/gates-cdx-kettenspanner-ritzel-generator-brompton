# Projektübersicht: Gates CDX Ritzel-Generator

Es gibt **5 getrennte Versionen**. Vor jeder Änderung klären: *Welche Version ist gemeint?*
Nicht mischen — Web, Android, Linux-App und FreeCAD sind verschiedene Dinge.

## Die 5 Versionen

| # | Version | Ordner | Was es ist | Läuft in |
|---|---|---|---|---|
| 1 | **Web** | `web/` | Konfigurator mit 3D-Vorschau (JavaScript/Three.js), über GitHub Pages | Browser (Chrome) |
| 2 | **Android-App** | `android/` | Kotlin-WebView, die `web/` ins App-Paket kopiert (Gradle-Task). Läuft offline | Handy |
| 3 | **Linux-App** | `linux/` | Eigenes GTK-Fenster (Python + WebKitGTK), liefert `web/` lokal aus. Paket als `.deb` | Eigenes Fenster, kein Browser |
| 4 | **FreeCAD** | `freecad/` | Bedienfeld „Zahnrad Setup“ (PySide), baut den echten CAD-Körper. Einstieg `freecad/main.py` | FreeCAD (Flatpak) |
| 5 | **Cloud-Bau / Release-Serie** | `freecad/build_headless.py` + `.github/workflows/` | FreeCAD ohne Oberfläche in GitHub Actions: erzeugt STEP/STL der Release-Dateien (Zähne 12–19) | GitHub Actions |

**Wichtig:** 2 und 3 sind keine eigene Oberfläche, sondern `web/` in einem anderen Rahmen.
Eine Änderung in `web/js/` oder `web/index.html` wirkt also auf **Web, Android und Linux-App zugleich**.
4 und 5 haben eigenen Python-Code (`freecad/`).

## Wo liegt was

- **Gemeinsame Quelle:** `params.json` (Eingabefelder, Standardwerte, Grenzen) — gelesen von Web **und** FreeCAD. Werte nur dort eintragen.
- **Geometrie doppelt:** Web `web/js/geometry.js` (Vorschau, Näherung) ↔ FreeCAD `freecad/zahnrad_generator.py` (exakt). Änderungen an der Form müssen **in beiden** gemacht werden. Geteilte Mathematik: `zahnprofil`, `speichen_geometrie`/`speichen.js` (geprüft mit `npm test`, braucht Node ≥ 20).
- **Boolesche Operationen (Mulden, Führung, Nabe, Speichen, Bügel):** `web/js/csg.js` mit `manifold-3d` (WebAssembly, als Base64 im Viewer-Bundle). Seit 2026-10-06 statt `three-bvh-csg`, das Netze mit Rissen lieferte (Slicer: „non-manifold edges“, Reddit-Meldung). Prüfung: `npm run test:dicht` (läuft in `pruefen.yml`). Ein Neuaufbau der Vorschau dauert dadurch ca. 1 s.
- **Web-Dateien:** `web/index.html`, `web/js/*.js` (Quellen), `web/js/*.bundle.js` (**generiert, nicht in Git**, `npm run build`).
- **Android:** `android/app/src/main/java/.../MainActivity.kt` (Download-Brücke `AndroidDownload`), `android/app/build.gradle`. Debug-APK: `cd android && ./gradlew assembleDebug`.
- **Linux-App:** `linux/ritzel-generator.py`, Paket bauen mit `linux/bauen-deb.sh` → `linux/dist/*.deb` (nicht in Git).
- **FreeCAD-Starter:** `linux/freecad-starter/` (Doppelklick-Datei, startet FreeCAD mit `freecad/main.py`).
- **STEP-Vermittler (Cloud-Bau auf Zuruf):** `worker/` (Cloudflare Worker) — derzeit **nicht erreichbar** (404), `STEP_API` in `web/js/config.js` ist deshalb leer.
- **CI:** `pages.yml` (Web veröffentlichen), `android.yml` (APK), `build-ritzel.yml` (Körper bauen), `release-serie.yml` (Release 12–19 Zähne), `pruefen.yml` + `bau-pruefen.yml` (Prüfungen im PR).
- **Doku:** `README.de.md` / `README.md` (FreeCAD + Web), `APK-HERUNTERLADEN.md` (Android).

## Unterschiede im Verhalten (Stand 2026-10-06)

| | Web | Android | Linux-App | FreeCAD |
|---|---|---|---|---|
| STEP-Button | ja (nur fertige Release-ZIP bei Standardwerten) | **nein, ausgeblendet** (`window.AndroidDownload`) | ja | gibt es nicht (Export über „Fertigteil“) |
| STEP für eigene Werte per Cloud | nein (Worker aus) | – | nein | – |
| Download STL/ZIP | Browser-Download | Brücke → `Downloads` | WebKit → `~/Downloads` | Export im Programm |
| Verrundungen | genähert | genähert | genähert | exakt (CAD) |
| Führung Ø `0` | **keine Führung** | keine Führung | keine Führung | **keine Führung** (seit 2026-10-06, vorher „auto“) |
| Läuft offline | nein | ja | ja | ja |

Pflege dieser Tabelle: bei jeder Änderung, die nur eine Version betrifft, hier eintragen.

## Regeln für die Zusammenarbeit

- Sprache: Deutsch.
- Erst **lokal** arbeiten; nur committen/pushen, wenn der Nutzer es sagt. Nicht ins Repo: `.claude/`, `tools/serie-parallel.sh`, `web/buegel/` (ungetrackt, nicht anfassen).
- Vor dem Ändern die passende README lesen — nicht raten, was „die App“ ist.
- Downloads/Installationen (SDK, Pakete) nur mit ausdrücklichem Ja.
- Prüfung der Web-Oberfläche: Testserver `python3 tools/dev-server.py 8765` (oder `preview_start web`).
- `npm test` braucht Node ≥ 20 (hier läuft Node 18 → Test bisher nicht ausgeführt).
- Android-Emulator (`~/Android/Sdk`, AVD `ritzel`, Android 14) ist eingerichtet, stürzte aber beim ersten Test ab; App dort noch nicht geprüft.
