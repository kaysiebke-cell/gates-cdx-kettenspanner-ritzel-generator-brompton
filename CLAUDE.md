# Projektübersicht: Gates CDX Ritzel-Generator

Es gibt **5 getrennte Versionen**. Vor jeder Änderung klären: *Welche Version ist gemeint?*
Nicht mischen — Web, Android, Linux-App und FreeCAD sind verschiedene Dinge.

## Wer ist wofür zuständig: Chrome oder GTK?

- **Chrome (bzw. jeder Browser) ist zuständig für die Web-Version — und nur dafür.** Dazu gehören die
  Webseite, ihr „Als App installieren“-Knopf (PWA: `manifest.webmanifest`, `sw.js`) und die Prüfung im Browser.
- **Die Linux-Anwendung ist GTK im Cinnamon-/Mint-Stil. Chrome hat dort nichts zu suchen.** Keine
  `chrome --app=…`-Starter, keine installierte Chrome-Web-App, kein `localhost`-Fenster in Chrome.
  Die Linux-App bringt ihre Oberfläche selbst mit (GTK-Widgets, WebView nur für die 3D-Vorschau).
- Android ist eine eigene App (Kotlin-WebView), FreeCAD läuft in FreeCAD. Beide ebenfalls ohne Chrome.
- Verwechslungsgefahr: Eine in Chrome installierte Web-App aus der Webseite heißt genauso wie die
  Linux-Anwendung („Gates CDX Ritzel-Generator …“), öffnet aber `localhost`/die Webseite. Sie ist **nicht**
  die Linux-App. Die echte Linux-App heißt im Menü „Ritzel-Generator“ (Programm `ritzel-generator`).

## Die 5 Versionen

| # | Version | Ordner | Was es ist | Läuft in |
|---|---|---|---|---|
| 1 | **Web** | `web/` | Konfigurator mit 3D-Vorschau (JavaScript/Three.js), über GitHub Pages | Browser (Chrome u. a.) |
| 2 | **Android-App** | `android/` | Kotlin-WebView, die `web/` ins App-Paket kopiert (Gradle-Task). Läuft offline | Handy |
| 3 | **Linux-App** | `linux/` | Echtes GTK-Programm (Python, Cinnamon-/Systemdesign): Formular, Reiter, Knöpfe sind GTK-Widgets; `web/` läuft als Rechenkern im Hintergrund, nur die 3D-Vorschau ist eine WebView. Paket als `.deb` | Eigenes GTK-Fenster, **kein Chrome** |
| 4 | **FreeCAD** | `freecad/` | Bedienfeld „Zahnrad Setup“ (PySide), baut den echten CAD-Körper. Einstieg `freecad/main.py` | FreeCAD (Flatpak) |
| 5 | **Cloud-Bau / Release-Serie** | `freecad/build_headless.py` + `.github/workflows/` | FreeCAD ohne Oberfläche in GitHub Actions: erzeugt STEP/STL der Release-Dateien (Zähne 12–19) | GitHub Actions |

**Wichtig:** 2 und 3 nutzen `web/` als Rechenkern (Geometrie, Export, STEP). Eine Änderung in `web/js/` wirkt also auf **Web, Android und Linux-App zugleich**. Die Linux-App liest ihr Formular aus der Seite (`#form`, Feld-IDs) und schreibt Werte dorthin zurück — wer IDs oder Aufbau des Formulars in `web/` ändert, muss `linux/ritzel-generator.py` prüfen.
4 und 5 haben eigenen Python-Code (`freecad/`).

## Wo liegt was

- **Gemeinsame Quelle:** `params.json` (Eingabefelder, Standardwerte, Grenzen) — gelesen von Web **und** FreeCAD. Werte nur dort eintragen.
- **Geometrie doppelt:** Web `web/js/geometry.js` (Vorschau, Näherung) ↔ FreeCAD `freecad/zahnrad_generator.py` (exakt). Änderungen an der Form müssen **in beiden** gemacht werden. Geteilte Mathematik: `zahnprofil`, `speichen_geometrie`/`speichen.js` (geprüft mit `npm test`, braucht Node ≥ 20).
- **Boolesche Operationen (Mulden, Führung, Nabe, Speichen, Bügel):** `web/js/csg.js` mit `manifold-3d` (WebAssembly, als Base64 im Viewer-Bundle). Seit 2026-10-06 statt `three-bvh-csg`, das Netze mit Rissen lieferte (Slicer: „non-manifold edges“, Reddit-Meldung). Prüfung: `npm run test:dicht` (läuft in `pruefen.yml`). Ein Neuaufbau der Vorschau dauert dadurch ca. 1 s.
- **Web-Dateien:** `web/index.html`, `web/js/*.js` (Quellen), `web/js/*.bundle.js` (**generiert, nicht in Git**, `npm run build`).
- **Android:** `android/app/src/main/java/.../MainActivity.kt` (Download-Brücke `AndroidDownload`), `android/app/build.gradle`. Debug-APK: `cd android && ./gradlew assembleDebug`.
- **Linux-App:** `linux/ritzel-generator.py`, Paket bauen mit `linux/bauen-deb.sh` → `linux/dist/*.deb` (nicht in Git).
- **FreeCAD-Starter:** `linux/freecad-starter/` (Doppelklick-Datei, startet FreeCAD mit `freecad/main.py`).
- **STEP-Vermittler (Cloud-Bau auf Zuruf):** `worker/` (Cloudflare Worker) — läuft seit 2026-10-06 wieder (neu deployt, `STEP_API` in `web/js/config.js` zeigt darauf; Token siehe Erinnerung unten).
- **CI:** `pages.yml` (Web veröffentlichen), `android.yml` (APK), `build-ritzel.yml` (Körper bauen), `release-serie.yml` (Release 12–19 Zähne), `pruefen.yml` + `bau-pruefen.yml` (Prüfungen im PR).
- **Doku:** `README.de.md` / `README.md` (kurzer Überblick mit den 4 Versionen), Details in `docs/de/` und `docs/en/` (je eine Seite pro Version plus Speichen, Lager, 3D-Druck, Projektstruktur, Rechtliches), `APK-HERUNTERLADEN.md` (Android). Aufbau nach dem Muster von `kaysiebke-cell/FreeCAD_MultiAI_Panel`. Die Seiten `docs/*/3d-druck.md` werden aus `web/js/print-data.js` erzeugt (`npm run docs`) — nicht von Hand ändern. Bilder in `bilder/` (`ansicht-*.png` = Ansichten der vier Versionen).

## Unterschiede im Verhalten (Stand 2026-10-06)

| | Web | Android | Linux-App | FreeCAD |
|---|---|---|---|---|
| STEP-Button | ja (Standardwerte: fertige Release-ZIP; eigene Werte: Cloud-Bau) | **nein, ausgeblendet** (`window.AndroidDownload`) | ja | gibt es nicht (Export über „Fertigteil“) |
| STEP für eigene Werte per Cloud | ja (Worker `ritzel-step`, ca. 2–3 Min) | – | ja | – |
| Download STL/ZIP | Browser-Download | Brücke → `Downloads` | WebKit → `~/Downloads` | Export im Programm |
| Verrundungen | genähert | genähert | genähert | exakt (CAD) |
| Riemenführung Ø `0` | **automatisch** (Zahnkranz − 1,1 mm) | automatisch | automatisch | automatisch |
| Riemenführung Breite `0` | kein Ring | kein Ring | kein Ring | kein Ring |
| Läuft offline | nein | ja | ja | ja |

Pflege dieser Tabelle: bei jeder Änderung, die nur eine Version betrifft, hier eintragen.

## ⚠️ Erinnerung: STEP-Token läuft ab (2027-01-04)

Der STEP-Bau für eigene Werte (Web) läuft über den Cloudflare-Worker `ritzel-step`
(`https://ritzel-step.kaysiebke.workers.dev`, Code in `worker/`). Er nutzt ein GitHub-Token
(fein abgestuft, Name `ritzel-step`, Actions: Read and write, Contents: Read-only) als Secret `GITHUB_TOKEN`.
**Bei Problemen mit dem STEP-Button/-Bau in der Web-Version zuerst den Nutzer auf dieses Token hinweisen.**
Erneuern: neues Token anlegen, dann im Ordner `worker/` `npx wrangler secret put GITHUB_TOKEN`
(Wert nur im Terminal des Nutzers). Kein Redeploy nötig. Das GitHub-Konto hat 2FA-Probleme
(alte Telefonnummer, keine Recovery-Codes) — Zugang rechtzeitig prüfen.

## Regeln für die Zusammenarbeit

- Sprache: Deutsch.
- Erst **lokal** arbeiten; nur committen/pushen, wenn der Nutzer es sagt. Nicht ins Repo: `.claude/`, `tools/serie-parallel.sh`, `web/buegel/` (ungetrackt, nicht anfassen).
- Vor dem Ändern die passende README lesen — nicht raten, was „die App“ ist.
- „Linux-App“ oder „PC-App“ heißt immer die GTK-Anwendung in `linux/`, nie die Webseite in Chrome.
- Downloads/Installationen (SDK, Pakete) nur mit ausdrücklichem Ja.
- Prüfung der Web-Oberfläche: Testserver `python3 tools/dev-server.py 8765` (oder `preview_start web`).
- `npm test` braucht Node ≥ 20 (hier läuft Node 18 → Test bisher nicht ausgeführt).
- Android-Emulator (`~/Android/Sdk`, AVD `ritzel`, Android 14) ist eingerichtet, stürzte aber beim ersten Test ab; App dort noch nicht geprüft.
