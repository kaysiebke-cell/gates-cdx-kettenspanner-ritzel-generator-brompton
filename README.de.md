# Gates CDX Riemenspanner-Ritzel Generator (Brompton)

> English version: [README.md](README.md)

Dieses Tool generiert parametrische **Umlenkrollen / Führungsritzel für den originalen oder modifizierten Brompton-Riemenspanner**, wenn das Faltrad auf den **Gates Carbon Drive (CDX)** Riemenantrieb umgerüstet wurde (z. B. bei einem Kinetics-Umbau). Die Ritzel werden als fertige 3D-Volumenkörper generiert – optimiert für den 3D-Druck oder die CNC-Fräse.

**Wichtig:** Dies ist *kein* tragendes Antriebsritzel für die Hinterradnabe, sondern ein kugelgelagertes **Schaltröllchen / Führungsritzel für den Riemenspanner**!

![FreeCAD](https://img.shields.io/badge/FreeCAD-1.1%2B-blue)
![Python](https://img.shields.io/badge/Python-PySide6-green)

![Fertiges Ritzel](bilder/ritzel.png)

## Quick Start: Online konfigurieren – ohne Installation

[![⚙ Konfigurator öffnen](https://img.shields.io/badge/%E2%9A%99%20Konfigurator%20%C3%B6ffnen-Live--Vorschau%20im%20Browser-blue?style=for-the-badge)](https://kaysiebke-cell.github.io/gates-cdx-kettenspanner-ritzel-generator-brompton/)

Im Web-Konfigurator kannst du das **Spannrollen-Ritzel live in 3D drehen und anpassen**. Zahnprofil, Schmutzöffnungen, Riemenführung, Nabe und Kugellagersitze verändern sich direkt mit deinen Wünschen.

**Zwei Wege zum Download:**
* **Fertige STL direkt laden:** Für Standardgrößen von **12 bis 18 Zähnen** liegen fertig verrundete Dateien bereit (gibt es auch inklusive STEP-Dateien im [Release "stl-serie"](https://github.com/kaysiebke-cell/gates-cdx-kettenspanner-ritzel-generator-brompton/releases/tag/stl-serie)).
* **Eigene Maße generieren:** Du kannst die Parameter frei eintragen (Zähnezahl **12–18**) und das STL direkt aus dem Browser ziehen (die Verrundungen werden hierbei angenähert; die exakten CAD-Verrundungen gibt es in den Release-Dateien).

## Nutzung direkt in FreeCAD

1. Kopiere den Projektordner in dein FreeCAD-Makroverzeichnis (oder an einen Ort deiner Wahl).
2. Starte die `freecad/main.py` als Makro in FreeCAD. Das Bedienfeld **"Zahnrad Setup"** dockt sich automatisch rechts an.

| Button | Funktion |
|---|---|
| **Vorschau** | Zeichnet nur die Skizze des Zahnprofils neu (geht extrem schnell). |
| **Körper erzeugen** | Baut den kompletten PartDesign-Körper auf. |
| **Fertigteil** | Erstellt eine saubere Kopie (`RitzelFertig`) ohne Feature-Baum – perfekt für den STL/STEP-Export. |

**Tipp:** Die Checkbox **"Rundungen anwenden"** steuert die Verrundungen. Da diese beim Berechnen am meisten Performance fressen, lässt man sie für schnelle Entwürfe am besten weg. Erst für das finale Teil aktivieren.

**Voraussetzungen:** FreeCAD 1.1+ (getestet als Flatpak unter Linux), keine weiteren Abhängigkeiten. Die UI des Panels ist auf Deutsch.

<img src="bilder/panel.png" alt="Bedienfeld &quot;Zahnrad Setup&quot;" width="320">

## Features

* **Komplett parametrisch:** Zähnezahl (**12–18**), Eingriffswinkel, Teilung, Kopf-/Fußradius und Zahntiefe lassen sich frei einstellen.
* **Durchdachte Geometrie:** Zentraler Steg als Riemenführung, seitliche Schmutzmulden (Winkel, Tiefe und Rundung anpassbar), plus Bohrung und Absätze für die Kugellager des Riemenspanners.
* **Smartes UI:** Das Dock-Panel ist übersichtlich aufgeteilt und passt sich automatisch an das FreeCAD-Design (Light/Dark Mode) an.
* **Merkt sich Einstellungen:** Die zuletzt genutzten Parameter werden beim nächsten Start automatisch wieder geladen.
* **Verrundungs-Cache:** Das Tool merkt sich funktionierende Radien. Schlägt ein Versuch fehl, springt es nicht komplett zurück, sondern spart teure Rechenzeit.
* **Cloud-Build & Web-Konfigurator:** Komplett im Browser nutzbar, falls du kein FreeCAD installiert hast.

## 3D-Druck (PA12-CF)

Das Ritzel live im [Online-Tool](https://kaysiebke-cell.github.io/gates-cdx-kettenspanner-ritzel-generator-brompton/) konfigurieren; dessen Tab **Druck-Empfehlungen** und der Abschnitt unten werden aus derselben Quelle (`web/js/print-data.js`) generiert und driften daher nie auseinander.

<!-- PRINT:START (auto-generiert aus web/js/print-data.js – nicht von Hand ändern; `npm run build`) -->
> ✅ Praxiserprobt: PA12-CF hat sich im realen Dauerbetrieb bewährt und erfüllt die Anforderungen – Laufleistung 2800–2850 km in ca. 5 Monaten und weiterhin im Einsatz.
>
> **Eigenschaften PA12-CF:** sehr verschleißfest · steif & formstabil · geringe Feuchtigkeitsaufnahme · gute Gleiteigenschaften (leiser Lauf) · hohe Dauer-/Ermüdungsfestigkeit · chemikalienbeständig · leicht

### Druckeinstellungen

| Parameter | Empfehlung | Details |
|---|---|---|
| **Filament** | PA12-CF | Kohlenstofffaserverstärktes Nylon – extrem verschleißfest, steif, nimmt weniger Feuchtigkeit auf als PA6. |
| **Düse** | ≥ 0,4 mm, gehärteter Stahl | CF-Fasern verstopfen kleinere Düsen und verschleißen Messing – gehärtete Stahldüse (oder Rubin) verwenden. |
| **Füllung** | 100 % | Maximale Stabilität und Langlebigkeit der Flansche – Vollfüllung ist nötig. |
| **Schichthöhe** | 0,12–0,16 mm | Feine Lagen für ruhigen Lauf – die Zahnflanken führen den Riemen, feine Lagen = vibrationsarmer Betrieb. |
| **Druckgeschwindigkeit** | Langsam (~20–40 mm/s) | CF-Filament ist abrasiv und zähflüssig – langsamer Druck verbessert Schichthaftung und Maßhaltigkeit. |
| **Kühlung (Bauteillüfter)** | 0–20 % (möglichst wenig) | Zu viel Kühlung schwächt die Schichthaftung – PA12-CF ohne oder nur mit sehr wenig Bauteillüfter drucken. |
| **Orientierung** | Flach auf die große Fläche | Zähne werden seitlich gedruckt – kein Stützmaterial an den Flanken nötig. |
| **Unterstützung** | Nur Nabe & Öffnungen | Der 1 mm tiefe Lagersitz druckt perfekt ohne Stützstrukturen. |
| **Düsen-Temperatur** | 250–280 °C (Start: 260 °C) | PA12-CF braucht hohe Temperaturen. Bei 260 °C starten, ±5 °C nach Bedarf anpassen. Die CF-Variante braucht stabile Hitze. |
| **Bett-Temperatur** | 80–120 °C | PA12-CF braucht ein beheiztes Druckbett. Höhere Temperaturen reduzieren Verzug und Schichtablösungen. |
| **Gehäuse-Temperatur** | 60–80 °C | Mit Enclosure: stabilisiert die Druckqualität deutlich. PA12-CF ist anspruchsvoll – Gehäusekontrolle zahlt sich aus. |
| **Trocknung** | 8 Stunden bei 70 °C | Vor dem Druck trocknen (falls die Spule offen lag). Bei langen Drucken die Spule in einer Drybox / mit Trockenmittel halten – Nylon zieht auch während des Drucks Feuchtigkeit. |

### Kompatible Drucker für PA12-CF

- Prusa XL + Enclosure
- Bambu Lab X1 Carbon
- Prusa MK3S+ / MK3.9S + Enclosure
- Zortrax M300+ / M300 Dual
- Ultimaker S5 Pro

**Anforderungen:** Beheiztes Druckbett (80–120 °C) · Temperaturkontrolliertes Gehäuse (ideal 60–80 °C) · Zuverlässige Kühlung · Gute Bett-Haftung (Bondtech, PEI, Garolite)

### Wichtige Hinweise

1. **PA12-CF ist anspruchsvoll** – nichts für Anfänger.
2. **Lagerung** – trockene Umgebung, Silica-Gel.
3. **Tempern (optional)** – kontrolliertes Tempern nach dem Druck (nach Herstellerangabe, oft 1–2 h knapp unter der Erweichungstemperatur, danach langsam abkühlen) erhöht Festigkeit und Formstabilität unter mechanischer Dauerlast. Vorher an einem Probeteil testen – leichter Verzug möglich.
4. **Passung Lagersitz** – PA12-CF schwindet beim Abkühlen. Praxiswert: den Lagersitz-Durchmesser um +0,2 mm größer auslegen (14-mm-Lager → 14,2 mm), damit das Lager (z. B. F605-2RS) fest sitzt. Am eigenen Drucker mit einem Probedruck prüfen (Schwund variiert).
5. **Bruchfestigkeit** – PA12-CF ist sehr steif, aber spröder als PA12. Nicht überbelasten.
6. **Druckqualität prüfen** – erste Proben vor der Serienfertigung machen.
7. **Gesundheit** – beim Nachbearbeiten (Schleifen/Bohren) entsteht reizender CF-Feinstaub. Absaugung und Staubmaske (FFP2/FFP3) verwenden.

### Oberfläche glätten & versiegeln (optional)

> ⚠️ Funktionsflächen maskieren – nicht beschichten oder schleifen: Lagersitz (F605-2RS, +0,2 mm), Zahnflanken (Riemenkontakt) und Bohrung/Achssitz.

1. **Füllen** – Schichtlinien mit dünnem Sekundenkleber (CA), Epoxid (z. B. XTC-3D) oder 2K-Füllprimer füllen – reines Schleifen allein reicht bei CF-Nylon nicht.
2. **Nass schleifen** – stufenweise 240 → 400 → 600 → 1000+, nass schleifen – bindet den reizenden CF-Feinstaub. Bei trockenen Arbeiten FFP2/FFP3-Maske.
3. **Versiegeln** – dünn Epoxid oder 2K-PU-Klarlack (UV-/wetterfest) auftragen. Nylon vorher entfetten und leicht anschleifen (haftet sonst schlecht); ggf. Kunststoff-Haftvermittler.
4. **Reihenfolge** – falls getempert wird: erst tempern, dann versiegeln (Hitze zerstört Beschichtungen).
5. **Nicht ratsam** – chemisches Dampfglätten braucht Ameisensäure (giftig/ätzend) – fürs Hobby vermeiden; Heißluft/Flamme verzieht CF-Nylon.

> ⚠️ Diese Angaben beruhen auf Recherche (Herstellerangaben, Drucker-Dokumentationen, Community-Erfahrungen, Datenblätter) und eigener Praxiserfahrung (siehe Kasten oben). Keine Garantie – bitte vor der Verwendung selbst testen und mit aktuellen Quellen abgleichen. Für Hobby-Projekte; keine kommerzielle Nutzung ohne Genehmigung.
<!-- PRINT:END -->

## Passende Kugellager

Die Standardwerte (Bohrung Ø 14 mm, Lagersitz Ø 16 mm × 1 mm) sind exakt auf das Miniatur-Flanschkugellager **F605-2RS (5 × 14 × 5 mm)** ausgelegt, welches perfekt auf die Achse des Brompton-Riemenspanners passt. Man braucht 2 Stück (eins pro Seite), wobei der Flansch im 1 mm tiefen Absatz sitzt.

<img src="bilder/f605-2rs-zeichnung.jpg" alt="Maßzeichnung F605-2RS" width="280">

Bezugsquelle für Deutschland: [F605-2RS bei Kugellager-Express](https://www.kugellager-express.de/miniatur-flanschkugellager-f-605-2rs-5x14x5-mm)

* **Wichtig:** Unbedingt die **2RS-Variante** (beidseitig gummigedichtet) nehmen. Die dichten am Riemenspanner im spritzwassergefährdeten Bereich deutlich besser gegen Regen und Dreck ab als Metalldeckel (ZZ).
* Für Ganzjahresfahrer lohnt sich die Edelstahl-Version **SF605-2RS**.
* **Passung testen:** PA12-CF schwindet beim Abkühlen. Bewährter Praxiswert: den Lagersitz-Durchmesser um **+0,2 mm** größer auslegen (z. B. 14-mm-Lager → 14,2 mm) für einen festen Presssitz. Der Schwund variiert je Drucker – am besten erst einen kleinen Testring drucken und den Parameter `Bohrung Ø` in 0,1-mm-Schritten feinjustieren.
* **Pressen, nicht hämmern:** Die Lager vorsichtig einpressen (z. B. im Schraubstock mit einer passenden Unterlegscheibe). Druck nur auf den Außenring ausüben, niemals auf den Innenring.

## Struktur der Dateien

| Datei | Inhalt |
|---|---|
| `freecad/main.py` | Der Einstiegspunkt für FreeCAD, lädt alle Module sauber rein. |
| `freecad/zahnrad_ui.py` | Das Bedienfeld (Eingaben, Buttons, Speichern der Werte). |
| `freecad/zahnrad_generator.py` | Die eigentliche Geometrie: Skizze des Zahnprofils und Aufbau des 3D-Körpers. |
| `freecad/zahnrad_params.py` | Definition der Variablen und Standardwerte. |
| `web/index.html` | Der Web-Konfigurator (läuft über GitHub Pages). |
| `freecad/build_headless.py` | Hilfsskript: Baut die Release-Serie (STEP/STL) im Hintergrund ohne GUI. |
| `freecad/render_gui_preview.py` | Cloud-Build: Rendert die Vorschau unter Xvfb. |
| `freecad/ritzel_params.py` | Cloud-Build: Standardwerte und JSON-Overrides. |
| `.github/workflows/build-ritzel.yml` | Die GitHub-Aktion für die automatischen Builds. |

## Rechtliches & Haftung

Gates® und CDX® sind eingetragene Marken der Gates Corporation; Brompton und Kinetics sind Marken der jeweiligen Eigentümer. Dieses Projekt ist ein unabhängiges Hobby-Tool. Es steht in keiner Verbindung zu den Herstellern und nutzt keine Original-Konstruktionsdaten – die Geometrie wurde eigenständig von einer **Spannrolle** vermessen und nachkonstruiert.

**Nur für den privaten Gebrauch:** Teile des Gates Carbon Drive Systems können patentrechtlich geschützt sein. In vielen Ländern (in Deutschland z. B. nach § 11 Nr. 1 PatG) ist die private, nicht-gewerbliche Herstellung für das eigene Fahrrad vom Patentschutz ausgenommen. Eine **gewerbliche Produktion oder der Verkauf** der generierten Ritzel kann jedoch Rechte Dritter verletzen und erfolgt komplett auf eigene Gefahr. 

Die Nutzung selbstgedruckter Bauteile im Straßenverkehr erfolgt auf eigene Verantwortung.
