# Gates CDX Riemenspanner-Ritzel Generator (Brompton)

**Parametrischer Generator für Umlenkrollen und Führungsritzel des Brompton-Riemenspanners – als Webseite, Android-App, Linux-Programm und FreeCAD-Bedienfeld.**

> English version: [README.md](README.md)

![FreeCAD](https://img.shields.io/badge/FreeCAD-1.1%2B-blue) ![Python](https://img.shields.io/badge/Python-GTK%20%7C%20PySide6-green) ![Web](https://img.shields.io/badge/Web-Browser-orange) ![Android](https://img.shields.io/badge/Android-APK-brightgreen)

<img src="bilder/titelbild.png" alt="Ritzel, Ritzel mit Speichen, Spannrolle und Riemenschutz – alles mit dem Tool erzeugt" width="720">

---

## Worum es geht

Dieses Tool erzeugt parametrische **Umlenkrollen und Führungsritzel für den originalen oder modifizierten Brompton-Riemenspanner**, wenn das Faltrad auf den **Gates Carbon Drive (CDX)** Riemenantrieb umgerüstet wurde (z. B. bei einem Kinetics-Umbau). Die Teile entstehen als fertige 3D-Körper – optimiert für den 3D-Druck oder die CNC-Fräse.

**Wichtig:** Das ist *kein* tragendes Antriebsritzel für die Hinterradnabe, sondern ein kugelgelagertes **Schaltröllchen / Führungsritzel für den Riemenspanner**.

---

## Vier Versionen

<table>
<tr>
<td width="50%" valign="top" align="center"><a href="docs/de/web.md"><img src="bilder/ansicht-web.png" alt="Web (Browser)" width="100%"></a><br><b>Web (Browser)</b><br>Nichts zu installieren – direkt im Browser konfigurieren und STL/STEP laden.</td>
<td width="50%" valign="top" align="center"><a href="docs/de/linux-app.md"><img src="bilder/ansicht-linux.png" alt="Linux-App (GTK, Cinnamon)" width="100%"></a><br><b>Linux-App (GTK, Cinnamon)</b><br>Eigenes Fenster im Systemdesign, kein Browser, läuft offline.</td>
</tr>
<tr>
<td width="50%" valign="top" align="center"><a href="docs/de/android.md"><img src="bilder/ansicht-android.png" alt="Android-App" height="380"></a><br><b>Android-App</b><br>Aufs Handy, läuft offline. Per APK installieren.</td>
<td width="50%" valign="top" align="center"><a href="docs/de/freecad.md"><img src="bilder/panel.png" alt="FreeCAD-Bedienfeld" height="380"></a><br><b>FreeCAD-Bedienfeld</b><br>Exakte CAD-Körper mit echten Verrundungen, STEP/STL aus FreeCAD.</td>
</tr>
</table>

| Ich möchte … | Version |
|---|---|
| schnell ausprobieren | **Web** |
| am Rechner ohne Browser arbeiten | **Linux-App** |
| unterwegs am Handy | **Android-App** |
| exakte Verrundungen und eigene Änderungen am Körper | **FreeCAD** |

→ Alle Unterschiede im Detail: [Versionen im Vergleich](docs/de/versionen.md)

---

## Schnellstart

1. **Web:** [Konfigurator öffnen](https://kaysiebke-cell.github.io/gates-cdx-kettenspanner-ritzel-generator-brompton/) – Werte eintragen, STL oder STEP laden.
2. **Linux-App:** `linux/bauen-deb.sh` ausführen, dann `sudo apt install ./linux/dist/ritzel-generator_*_all.deb` → „Ritzel-Generator“ im Menü. → [Details](docs/de/linux-app.md)
3. **Android:** [APK herunterladen](https://github.com/kaysiebke-cell/gates-cdx-kettenspanner-ritzel-generator-brompton/releases/download/app/ritzel-generator.apk) und installieren. → [Details](docs/de/android.md)
4. **FreeCAD:** Projektordner kopieren, `freecad/main.py` als Makro starten – das Bedienfeld „Zahnrad Setup“ dockt rechts an. → [Details](docs/de/freecad.md)

---

## Highlights

* **Komplett parametrisch:** Zähnezahl (**12–19**), Eingriffswinkel, Teilung, Kopf-/Fußradius und Zahntiefe frei einstellbar.
* **Durchdachte Geometrie:** Zentraler Steg als Riemenführung (Breite und Ø einstellbar, Ø 0 = automatisch), seitliche Schmutzmulden, Bohrung und Absätze für die Kugellager des Riemenspanners.
* **Speichen zum Materialsparen:** Durchbrüche im Steg, gerade oder geschwungen – bei 19 Zähnen rund ein Viertel weniger Material. → [Speichen](docs/de/speichen.md)
* **Druckfertige Dateien:** STL-Netze sind geschlossen (Slicer-tauglich ohne Reparatur), STEP mit exakten CAD-Verrundungen.
* **Auch die Spannrolle und der Riemenschutz-Bügel** lassen sich erzeugen.
* **Vier Versionen, eine Quelle:** `params.json` ist die einzige Quelle für Felder und Standardwerte; `npm test` und `npm run test:dicht` halten Web und CAD gleich bzw. prüfen die Netze.
* **Praxiserprobt:** PA12-CF im Dauerbetrieb, über 2800 km. → [3D-Druck](docs/de/3d-druck.md)

---

## Dokumentation

Die Seiten sind in dieser Reihenfolge zum Durchlesen gedacht.

| Thema | Seite |
|---|---|
| 1 · Die vier Versionen im Vergleich | [versionen.md](docs/de/versionen.md) |
| 2 · Web-Version | [web.md](docs/de/web.md) |
| 3 · Linux-App (GTK, Cinnamon) | [linux-app.md](docs/de/linux-app.md) |
| 4 · Android-App | [android.md](docs/de/android.md) |
| 5 · FreeCAD-Bedienfeld | [freecad.md](docs/de/freecad.md) |
| 6 · 3D-Druck (PA12-CF) | [3d-druck.md](docs/de/3d-druck.md) |
| 7 · Speichen (Material sparen) | [speichen.md](docs/de/speichen.md) |
| 8 · Passende Kugellager | [kugellager.md](docs/de/kugellager.md) |
| 9 · Projektstruktur | [projektstruktur.md](docs/de/projektstruktur.md) |
| 10 · Rechtliches & Haftung | [rechtliches.md](docs/de/rechtliches.md) |

---

## Rechtliches

Gates® und CDX® sind eingetragene Marken der Gates Corporation; Brompton und Kinetics sind Marken der jeweiligen Eigentümer. Dieses Projekt ist ein unabhängiges Hobby-Tool ohne Verbindung zu den Herstellern; die Geometrie wurde eigenständig vermessen. **Nur für den privaten Gebrauch**, Nutzung der Teile im Straßenverkehr auf eigene Verantwortung. → [Rechtliches & Haftung](docs/de/rechtliches.md)
