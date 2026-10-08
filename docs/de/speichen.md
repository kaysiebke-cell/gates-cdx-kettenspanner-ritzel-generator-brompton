# Speichen (Material sparen)

[← Übersicht](../../README.de.md) · [Alle Seiten](../../README.de.md#dokumentation)

---

Zwischen Nabe und Zahnkranz sitzt ein massiver Steg über die volle Breite. Tragend gebraucht wird er nicht: Das Teil ist eine kugelgelagerte Umlenkrolle, überträgt also kein Drehmoment – der Steg hält nur den Zahnkranz konzentrisch zur Nabe. Über das Feld **Speichen** lassen sich dort Durchbrüche schneiden.

| Parameter | Bedeutung |
|---|---|
| `Speichen` | Anzahl der Arme. **0 = aus** (Standard), sinnvoll sind 4–6. |
| `Speichen Breite` | Breite eines Arms quer zur Speiche (Standard 4,5 mm). |
| `Schwung (°)` | 0° = gerade, radiale Speichen. Größere Werte biegen die Arme tangential. Passt der Wert nicht in den Ring, wird er automatisch zurückgenommen. |
| `Wandstärke` | Stehen bleibendes Material am Zahnkranz **und** an der Nabe (Standard 2,0 mm). Jeder Millimeter mehr nimmt dem freien Ring 2 mm weg – darüber bleibt der Steg voll: 17 Zähne bis 2,5 mm, 18 Zähne bis 3,0 mm, 19 Zähne bis 4,0 mm. |
| `Speichen-Rundung` | Eckenradius der Öffnungen. Wird direkt in der Skizze gezeichnet, nicht als 3D-Verrundung. |

**Ab wann es sich lohnt:** Maßgeblich ist nicht der Zahnfuß, sondern die Schmutzmulde. Sie wird mit `Mulden-Winkel` zur Stirnfläche hin tiefer und endet dort rund 2,8 mm weiter innen als am Mittelsteg – erst darunter steht Material über die volle Breite. Bleiben zwischen Nabenkragen und Kranz weniger als 5 mm frei, werden gar keine Speichen gebaut und der Steg bleibt voll. Mit den Standardwerten liegt die Grenze bei 17 Zähnen:

| Zähne | Freier Ring | 5 gerade Speichen |
|---|---|---|
| ≤ 16 | < 5 mm | – (Steg bleibt voll) |
| 17 | 6,4 mm | −4,9 cm³ (≈ 5,2 g) |
| 18 | 8,0 mm | −6,6 cm³ (≈ 7,0 g) |
| 19 | 9,6 mm | −8,6 cm³ (≈ 9,1 g) |

Wer auch bei kleineren Ritzeln Speichen will, muss zuerst `Tiefe am Steg` oder `Mulden-Winkel` zurücknehmen.

> **Hinweis:** Die vorgebauten Release-Dateien (12–19 Zähne) sind ohne Speichen gebaut. Sobald du Speichen aktivierst, weichen deine Werte vom Standard ab – die STL lädst du dann direkt aus dem Browser. Einen Cloud-Bau für eigene STEP-Werte gibt es zurzeit nicht (Vermittler abgeschaltet) – dafür den Körper in FreeCAD erzeugen.
