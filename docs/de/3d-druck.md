# 3D-Druck (PA12-CF)

[← Übersicht](../../README.de.md) · [Alle Seiten](../../README.de.md#dokumentation)

---

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
