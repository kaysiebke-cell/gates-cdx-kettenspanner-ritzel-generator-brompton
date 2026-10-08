# FreeCAD-Bedienfeld

[← Übersicht](../../README.de.md) · [Alle Seiten](../../README.de.md#dokumentation)

---

1. Kopiere den Projektordner in dein FreeCAD-Makroverzeichnis (oder an einen Ort deiner Wahl).
2. Starte die `freecad/main.py` als Makro in FreeCAD. Das Bedienfeld **"Zahnrad Setup"** dockt sich automatisch rechts an.
   Unter Linux (FreeCAD als Flatpak) startet das auch per Doppelklick auf `linux/freecad-starter/Ritzel-Generator.desktop`.

| Button | Funktion |
|---|---|
| **Vorschau** | Zeichnet nur die Skizze des Zahnprofils neu (geht extrem schnell). |
| **Körper erzeugen** | Baut den kompletten PartDesign-Körper auf. |
| **Fertigteil** | Erstellt eine saubere Kopie (`RitzelFertig`) ohne Feature-Baum – perfekt für den STL/STEP-Export. |

**Tipp:** Die Checkbox **"Rundungen anwenden"** steuert die Verrundungen. Da diese beim Berechnen am meisten Performance fressen, lässt man sie für schnelle Entwürfe am besten weg. Erst für das finale Teil aktivieren.

**Voraussetzungen:** FreeCAD 1.1+ (getestet als Flatpak unter Linux), keine weiteren Abhängigkeiten. Die UI des Panels ist auf Deutsch.

<img src="../../bilder/panel.png" alt="Bedienfeld &quot;Zahnrad Setup&quot;" width="320">
