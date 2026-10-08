# Die vier Versionen im Vergleich

[← Übersicht](../../README.de.md) · [Alle Seiten](../../README.de.md#dokumentation)

---

Alle vier Versionen erzeugen dasselbe Ritzel. Sie unterscheiden sich darin, **wo sie laufen** und **was sie exportieren**.

| | Web | Linux-App | Android-App | FreeCAD |
|---|---|---|---|---|
| Läuft in | Browser (Chrome, Firefox, …) | Eigenes GTK-Fenster im Cinnamon-Stil, **kein Browser** | Handy, Android-App | FreeCAD (z. B. Flatpak) |
| Installation | keine | `.deb`-Paket | APK | Ordner kopieren |
| Läuft offline | teilweise (nach dem ersten Besuch, Service Worker) | ja | ja | ja |
| 3D-Vorschau | ja | ja | ja | im FreeCAD-Fenster |
| Verrundungen | angenähert | angenähert | angenähert | **exakt (CAD)** |
| STL-Export | ja (ZIP mit Bügel) | ja | ja | ja (über „Fertigteil“) |
| STEP-Export | ja: fertige Dateien für 12–19 Zähne, eigene Werte per Cloud-Bau (ca. 2–3 Min.) | wie Web | **nein** (braucht ohnehin ein CAD-Programm) | ja (über „Fertigteil“) |
| Riemenführung Ø `0` | automatisch | automatisch | automatisch | automatisch |
| Riemenführung Breite `0` | kein Ring | kein Ring | kein Ring | kein Ring |

**Welche Version passt?**

- Schnell ausprobieren, nichts installieren → **Web**.
- Am Rechner arbeiten, ohne Browser und offline → **Linux-App**.
- Unterwegs, offline → **Android-App**.
- Exakte Verrundungen, eigene Änderungen am Körper, STEP direkt aus dem CAD → **FreeCAD**.

Die Web-Version, die Android-App und die Linux-App benutzen **denselben Rechenkern** (`web/`). Ändert sich dort etwas, wirkt es auf alle drei. FreeCAD hat eigenen Python-Code, gemeinsam ist nur `params.json`.
