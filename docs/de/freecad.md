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

**Bauteil wählen:** Oben im Bedienfeld steht die Auswahl **Bauteil** mit drei Einträgen: **Ritzel**, **Spannrolle** und **Riemenschutz-Bügel**. Jedes Bauteil hat seine eigenen Felder und Knöpfe.

**Riemenschutz-Bügel:** Wählst du ihn aus, übernimmt das Bedienfeld Zähnezahl, Mitte-Mitte und Kopf-Ø vom Ritzel, damit der Bügel passt. Danach lassen sich die Werte am Bügel noch ändern. **Riemenschutz-Bügel erzeugen** baut ihn passend zur Arbeitsumgebung: in **Part** als fertigen Körper, in **Part Design** als Body mit Verlauf (in anderen Umgebungen wie Part Design). Den Bügel gibt es nur für **12–18 Zähne**.

**Tipp:** Die Checkbox **"Rundungen anwenden"** steuert die Verrundungen. Da diese beim Berechnen am meisten Performance fressen, lässt man sie für schnelle Entwürfe am besten weg. Erst für das finale Teil aktivieren.

**Voraussetzungen:** FreeCAD 1.1+ (getestet als Flatpak unter Linux), keine weiteren Abhängigkeiten. Die UI des Panels ist auf Deutsch.

<img src="../../bilder/panel.png" alt="Bedienfeld &quot;Zahnrad Setup&quot;" width="320">
