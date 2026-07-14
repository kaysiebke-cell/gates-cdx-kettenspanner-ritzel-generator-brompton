// ── Druck-Empfehlungen (Tab-Inhalt) ─────────────────────────────────
// Datengetrieben (de/en in einem), damit die Struktur nicht doppelt
// gepflegt werden muss. Nur ins Shell-Bundle importiert – kein 3D nötig.

const H = {
  de: {
    heading: '🖨️ Druck-Empfehlungen: PA12-CF für Gates CDX Ritzel',
    settings: 'Druckeinstellungen',
    printers: 'Kompatible Drucker für PA12-CF',
    reqs: 'Anforderungen',
    notes: 'Wichtige Hinweise',
    disclaimer: '⚠️ Diese Angaben sind aus Recherche zusammengetragen (Herstellerangaben, Drucker-Dokumentationen, Community-Erfahrungen, Datenblätter). Keine Garantie – bitte vor der Verwendung selbst testen und mit aktuellen Quellen abgleichen. Für Hobby-Projekte; keine kommerzielle Nutzung ohne Genehmigung.',
  },
  en: {
    heading: '🖨️ Print recommendations: PA12-CF for Gates CDX sprocket',
    settings: 'Print settings',
    printers: 'Compatible printers for PA12-CF',
    reqs: 'Requirements',
    notes: 'Important notes',
    disclaimer: '⚠️ This information was compiled from research (manufacturer specs, printer documentation, community experience, datasheets). No guarantee – please test yourself before use and cross-check with current sources. For hobby projects; no commercial use without permission.',
  },
};

const SPECS = [
  { p:{de:'Filament',en:'Filament'},
    v:{de:'PA12-CF',en:'PA12-CF'},
    d:{de:'Kohlenstofffaserverstärktes Nylon – extrem verschleißfest, steif, nimmt weniger Feuchtigkeit auf als PA6.',
       en:'Carbon-fiber reinforced nylon – extremely wear-resistant, stiff, absorbs less moisture than PA6.'} },
  { p:{de:'Füllung',en:'Infill'},
    v:{de:'100 %',en:'100%'},
    d:{de:'Maximale Stabilität und Langlebigkeit der Flansche – Vollfüllung ist nötig.',
       en:'Maximum stability and durability of the flanges – full infill is required.'} },
  { p:{de:'Schichthöhe',en:'Layer height'},
    v:{de:'0,12–0,16 mm',en:'0.12–0.16 mm'},
    d:{de:'Feine Lagen für ruhigen Lauf – die Zahnflanken führen den Riemen, feine Lagen = vibrationsarmer Betrieb.',
       en:'Fine layers for smooth running – the tooth flanks guide the belt, fine layers = low-vibration operation.'} },
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
    d:{de:'Wichtig: PA12 vor dem Druck trocknen (falls die Spule offen lag).',
       en:'Important: dry PA12 before printing (if the spool was left open).'} },
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

const NOTES = {
  de: [
    'PA12-CF ist anspruchsvoll – nichts für Anfänger.',
    'Lagerung wichtig – trockene Umgebung, Silica-Gel.',
    'Düsenverschleiß – CF-verstärkte Kunststoffe verschleißen Messingdüsen. Gehärtete Stahldüse empfohlen.',
    'Bruchfestigkeit – PA12-CF ist sehr steif, aber spröder als PA12. Nicht überbelasten.',
    'Druckqualität prüfen – erste Proben vor der Serienfertigung machen.',
  ],
  en: [
    'PA12-CF is demanding – not for beginners.',
    'Storage matters – dry environment, silica gel.',
    'Nozzle wear – CF-reinforced plastics wear out brass nozzles. A hardened steel nozzle is recommended.',
    'Fracture strength – PA12-CF is very stiff but more brittle than PA12. Do not overload.',
    'Check print quality – make first samples before mass production.',
  ],
};

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

export function renderPrint(lang) {
  const L = lang === 'en' ? 'en' : 'de';
  const h = H[L];
  const specs = SPECS.map(s =>
    `<div class="spec"><dt>${esc(s.p[L])}</dt>` +
    `<dd><b>${esc(s.v[L])}</b><span>${esc(s.d[L])}</span></dd></div>`).join('');
  const printers = PRINTERS.map(p => `<li>${esc(p)}</li>`).join('');
  const reqs = REQS[L].map(r => `<li>${esc(r)}</li>`).join('');
  const notes = NOTES[L].map(n => `<li>${esc(n)}</li>`).join('');
  return (
    `<article class="printdoc">` +
    `<h2>${esc(h.heading)}</h2>` +
    `<h3>${esc(h.settings)}</h3>` +
    `<dl class="specs">${specs}</dl>` +
    `<h3>${esc(h.printers)}</h3><ul class="ticks">${printers}</ul>` +
    `<h4>${esc(h.reqs)}</h4><ul>${reqs}</ul>` +
    `<h3>${esc(h.notes)}</h3><ol>${notes}</ol>` +
    `<p class="disclaimer">${esc(h.disclaimer)}</p>` +
    `</article>`
  );
}
