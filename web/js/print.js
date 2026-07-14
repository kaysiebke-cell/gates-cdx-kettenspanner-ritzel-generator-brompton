// ── Druck-Empfehlungen (Tab-Inhalt) ─────────────────────────────────
// Datengetrieben (de/en in einem), damit die Struktur nicht doppelt
// gepflegt werden muss. Nur ins Shell-Bundle importiert – kein 3D nötig.

const H = {
  de: {
    heading: '🖨️ Druck-Empfehlungen: PA12-CF für Gates CDX Ritzel',
    fieldtest: '✅ Praxiserprobt: PA12-CF hat sich im realen Dauerbetrieb bewährt und erfüllt die Anforderungen – Laufleistung 2800–2850 km in ca. 5 Monaten und weiterhin im Einsatz.',
    props_label: 'Eigenschaften PA12-CF',
    settings: 'Druckeinstellungen',
    printers: 'Kompatible Drucker für PA12-CF',
    reqs: 'Anforderungen',
    notes: 'Wichtige Hinweise',
    disclaimer: '⚠️ Diese Angaben beruhen auf Recherche (Herstellerangaben, Drucker-Dokumentationen, Community-Erfahrungen, Datenblätter) und eigener Praxiserfahrung (siehe Kasten oben). Keine Garantie – bitte vor der Verwendung selbst testen und mit aktuellen Quellen abgleichen. Für Hobby-Projekte; keine kommerzielle Nutzung ohne Genehmigung.',
  },
  en: {
    heading: '🖨️ Print recommendations: PA12-CF for Gates CDX sprocket',
    fieldtest: '✅ Field-tested: PA12-CF has proven itself in real continuous operation and meets the requirements – mileage of 2,800–2,850 km over about 5 months and still in use.',
    props_label: 'PA12-CF properties',
    settings: 'Print settings',
    printers: 'Compatible printers for PA12-CF',
    reqs: 'Requirements',
    notes: 'Important notes',
    disclaimer: '⚠️ This information is based on research (manufacturer specs, printer documentation, community experience, datasheets) and hands-on field experience (see box above). No guarantee – please test yourself before use and cross-check with current sources. For hobby projects; no commercial use without permission.',
  },
};

// Materialeigenschaften von PA12-CF (relevant fürs Ritzel im Riemenantrieb)
const PROPS = {
  de: [
    'sehr verschleißfest', 'steif & formstabil', 'geringe Feuchtigkeitsaufnahme',
    'gute Gleiteigenschaften (leiser Lauf)', 'hohe Dauer-/Ermüdungsfestigkeit',
    'chemikalienbeständig', 'leicht',
  ],
  en: [
    'highly wear-resistant', 'stiff & dimensionally stable', 'low moisture absorption',
    'good sliding properties (quiet running)', 'high fatigue endurance',
    'chemically resistant', 'lightweight',
  ],
};

const SPECS = [
  { p:{de:'Filament',en:'Filament'},
    v:{de:'PA12-CF',en:'PA12-CF'},
    d:{de:'Kohlenstofffaserverstärktes Nylon – extrem verschleißfest, steif, nimmt weniger Feuchtigkeit auf als PA6.',
       en:'Carbon-fiber reinforced nylon – extremely wear-resistant, stiff, absorbs less moisture than PA6.'} },
  { p:{de:'Düse',en:'Nozzle'},
    v:{de:'≥ 0,4 mm, gehärteter Stahl',en:'≥ 0.4 mm, hardened steel'},
    d:{de:'CF-Fasern verstopfen kleinere Düsen und verschleißen Messing – gehärtete Stahldüse (oder Rubin) verwenden.',
       en:'CF fibers clog smaller nozzles and wear out brass – use a hardened steel (or ruby) nozzle.'} },
  { p:{de:'Füllung',en:'Infill'},
    v:{de:'100 %',en:'100%'},
    d:{de:'Maximale Stabilität und Langlebigkeit der Flansche – Vollfüllung ist nötig.',
       en:'Maximum stability and durability of the flanges – full infill is required.'} },
  { p:{de:'Schichthöhe',en:'Layer height'},
    v:{de:'0,12–0,16 mm',en:'0.12–0.16 mm'},
    d:{de:'Feine Lagen für ruhigen Lauf – die Zahnflanken führen den Riemen, feine Lagen = vibrationsarmer Betrieb.',
       en:'Fine layers for smooth running – the tooth flanks guide the belt, fine layers = low-vibration operation.'} },
  { p:{de:'Druckgeschwindigkeit',en:'Print speed'},
    v:{de:'Langsam (~20–40 mm/s)',en:'Slow (~20–40 mm/s)'},
    d:{de:'CF-Filament ist abrasiv und zähflüssig – langsamer Druck verbessert Schichthaftung und Maßhaltigkeit.',
       en:'CF filament is abrasive and viscous – slower printing improves layer adhesion and dimensional accuracy.'} },
  { p:{de:'Kühlung (Bauteillüfter)',en:'Cooling (part fan)'},
    v:{de:'0–20 % (möglichst wenig)',en:'0–20% (as little as possible)'},
    d:{de:'Zu viel Kühlung schwächt die Schichthaftung – PA12-CF ohne oder nur mit sehr wenig Bauteillüfter drucken.',
       en:'Too much cooling weakens layer adhesion – print PA12-CF with no or only minimal part cooling.'} },
  { p:{de:'Orientierung',en:'Orientation'},
    v:{de:'Flach auf die große Fläche',en:'Flat on the large face'},
    d:{de:'Zähne werden seitlich gedruckt – kein Stützmaterial an den Flanken nötig.',
       en:'Teeth are printed sideways – no support material needed on the flanks.'} },
  { p:{de:'Unterstützung',en:'Support'},
    v:{de:'Nur Nabe & Öffnungen',en:'Only hub & openings'},
    d:{de:'Der 1 mm tiefe Lagersitz druckt perfekt ohne Stützstrukturen.',
       en:'The 1 mm deep bearing seat prints perfectly without supports.'} },
  { p:{de:'Düsen-Temperatur',en:'Nozzle temperature'},
    v:{de:'250–280 °C (Start: 260 °C)',en:'250–280 °C (start: 260 °C)'},
    d:{de:'PA12-CF braucht hohe Temperaturen. Bei 260 °C starten, ±5 °C nach Bedarf anpassen. Die CF-Variante braucht stabile Hitze.',
       en:'PA12-CF needs high temperatures. Start at 260 °C, adjust ±5 °C as needed. The CF variant needs stable heat.'} },
  { p:{de:'Bett-Temperatur',en:'Bed temperature'},
    v:{de:'80–120 °C',en:'80–120 °C'},
    d:{de:'PA12-CF braucht ein beheiztes Druckbett. Höhere Temperaturen reduzieren Verzug und Schichtablösungen.',
       en:'PA12-CF needs a heated bed. Higher temperatures reduce warping and layer separation.'} },
  { p:{de:'Gehäuse-Temperatur',en:'Chamber temperature'},
    v:{de:'60–80 °C',en:'60–80 °C'},
    d:{de:'Mit Enclosure: stabilisiert die Druckqualität deutlich. PA12-CF ist anspruchsvoll – Gehäusekontrolle zahlt sich aus.',
       en:'With enclosure: noticeably stabilizes print quality. PA12-CF is demanding – chamber control pays off.'} },
  { p:{de:'Trocknung',en:'Drying'},
    v:{de:'8 Stunden bei 70 °C',en:'8 hours at 70 °C'},
    d:{de:'Vor dem Druck trocknen (falls die Spule offen lag). Bei langen Drucken die Spule in einer Drybox / mit Trockenmittel halten – Nylon zieht auch während des Drucks Feuchtigkeit.',
       en:'Dry before printing (if the spool was left open). For long prints keep the spool in a drybox / with desiccant – nylon keeps absorbing moisture during printing.'} },
];

const PRINTERS = [
  'Prusa XL + Enclosure',
  'Bambu Lab X1 Carbon',
  'Prusa MK3S+ / MK3.9S + Enclosure',
  'Zortrax M300+ / M300 Dual',
  'Ultimaker S5 Pro',
];

const REQS = {
  de: [
    'Beheiztes Druckbett (80–120 °C)',
    'Temperaturkontrolliertes Gehäuse (ideal 60–80 °C)',
    'Zuverlässige Kühlung',
    'Gute Bett-Haftung (Bondtech, PEI, Garolite)',
  ],
  en: [
    'Heated bed (80–120 °C)',
    'Temperature-controlled chamber (ideal 60–80 °C)',
    'Reliable cooling',
    'Good bed adhesion (Bondtech, PEI, Garolite)',
  ],
};

// Leitwort (t) + Detail (d) – parallel zu SPECS, damit die Darstellung
// zum Parameter-Raster passt (fettes Leitwort statt Fließtext-Block).
const NOTES = [
  { t:{de:'PA12-CF ist anspruchsvoll', en:'PA12-CF is demanding'},
    d:{de:'nichts für Anfänger.', en:'not for beginners.'} },
  { t:{de:'Lagerung', en:'Storage'},
    d:{de:'trockene Umgebung, Silica-Gel.', en:'dry environment, silica gel.'} },
  { t:{de:'Tempern (optional)', en:'Annealing (optional)'},
    d:{de:'kontrolliertes Tempern nach dem Druck (nach Herstellerangabe, oft 1–2 h knapp unter der Erweichungstemperatur, danach langsam abkühlen) erhöht Festigkeit und Formstabilität unter mechanischer Dauerlast. Vorher an einem Probeteil testen – leichter Verzug möglich.',
       en:'controlled annealing after printing (per manufacturer spec, often 1–2 h just below the softening temperature, then cool slowly) increases strength and dimensional stability under continuous mechanical load. Test on a sample first – slight warping is possible.'} },
  { t:{de:'Passung Lagersitz', en:'Bearing-seat fit'},
    d:{de:'PA12-CF schwindet beim Abkühlen. Praxiswert: den Lagersitz-Durchmesser um +0,2 mm größer auslegen (14-mm-Lager → 14,2 mm), damit das Lager (z. B. F605-2RS) fest sitzt. Am eigenen Drucker mit einem Probedruck prüfen (Schwund variiert).',
       en:'PA12-CF shrinks as it cools. Proven value: make the bearing-seat diameter +0.2 mm larger (14 mm bearing → 14.2 mm) for a firm press fit (e.g. F605-2RS). Verify on your own printer with a test print (shrinkage varies).'} },
  { t:{de:'Bruchfestigkeit', en:'Fracture strength'},
    d:{de:'PA12-CF ist sehr steif, aber spröder als PA12. Nicht überbelasten.',
       en:'PA12-CF is very stiff but more brittle than PA12. Do not overload.'} },
  { t:{de:'Druckqualität prüfen', en:'Check print quality'},
    d:{de:'erste Proben vor der Serienfertigung machen.',
       en:'make first samples before mass production.'} },
  { t:{de:'Gesundheit', en:'Health'},
    d:{de:'beim Nachbearbeiten (Schleifen/Bohren) entsteht reizender CF-Feinstaub. Absaugung und Staubmaske (FFP2/FFP3) verwenden.',
       en:'post-processing (sanding/drilling) creates irritating CF fine dust. Use extraction and a dust mask (FFP2/FFP3).'} },
];

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

export function renderPrint(lang) {
  const L = lang === 'en' ? 'en' : 'de';
  const h = H[L];
  const specs = SPECS.map(s =>
    `<div class="spec"><dt>${esc(s.p[L])}</dt>` +
    `<dd><b>${esc(s.v[L])}</b><span>${esc(s.d[L])}</span></dd></div>`).join('');
  const printers = PRINTERS.map(p => `<li>${esc(p)}</li>`).join('');
  const reqs = REQS[L].map(r => `<li>${esc(r)}</li>`).join('');
  const notes = NOTES.map(n => `<li><b>${esc(n.t[L])}</b> – ${esc(n.d[L])}</li>`).join('');
  return (
    `<article class="printdoc">` +
    `<h2>${esc(h.heading)}</h2>` +
    `<div class="fieldtest">` +
      `<p>${esc(h.fieldtest)}</p>` +
      `<p class="props"><b>${esc(h.props_label)}:</b> ` +
      PROPS[L].map(esc).join(' · ') + `</p>` +
    `</div>` +
    `<h3>${esc(h.settings)}</h3>` +
    `<dl class="specs">${specs}</dl>` +
    `<h3>${esc(h.printers)}</h3><ul class="ticks">${printers}</ul>` +
    `<h4>${esc(h.reqs)}</h4><ul>${reqs}</ul>` +
    `<h3>${esc(h.notes)}</h3><ol class="notes">${notes}</ol>` +
    `<p class="disclaimer">${esc(h.disclaimer)}</p>` +
    `</article>`
  );
}
