// ── Internationalisierung (i18n) ────────────────────────────────────────────
export const i18n = {
  // Sprache in einem Global halten, damit shell.bundle.js und
  // viewer.bundle.js (zwei getrennte Skripte) dieselbe Sprache teilen.
  get lang() { return (typeof window !== 'undefined' && window.__ritzelLang) || 'de'; },
  set lang(v) { if (typeof window !== 'undefined') window.__ritzelLang = v; },
  strings: {
    de: {
      title: 'Gates CDX Riemenspanner-Ritzel Generator (Brompton)',
      subtitle: 'Werte ändern → Vorschau aktualisiert sich sofort · Ansicht mit Maus oder Finger drehen/zoomen',
      tab_gen: 'Generator',
      tab_print: 'Druck-Empfehlungen',
      leg1: 'Zahnrad-Körper (Grundkörper)',
      leg2: 'Zylinder (Kugellager)',
      leg3: 'Seitliche Schmutzabweiser',
      hint1: 'Zahn- und Mulden-Rundung werden in der Vorschau angenähert dargestellt; die Release-Dateien enthalten die exakten CAD-Verrundungen.',
      series_stl: 'Verrundete STL direkt herunterladen',
      series_step: 'Gleiche Datei als STEP (für CAD)',
      custom_stl: 'ZIP herunterladen (Ritzel + Bügel als STL)',
      step_both: 'STEP-ZIP herunterladen (Ritzel + Bügel)',
      step_hint: 'Exakte CAD-STEP für Standardwerte — Ritzel und Bügel gebündelt in einer ZIP aus dem Release.',
      step_build: '📐 STEP für diese Werte bauen (~2–5 Min)',
      step_build_hint: 'Baut deine individuellen Werte per FreeCAD in der Cloud und lädt Ritzel + Bügel als STEP-ZIP herunter.',
      step_only_standard: 'STEP gibt es fertig nur für Standardwerte. Für eigene Werte bitte den STL-Download nutzen.',
      step_building: 'Baue STEP in der Cloud … das dauert typisch 2–5 Min. Bitte diese Seite offen lassen.',
      step_queued: 'In Warteschlange … der Cloud-Build startet gleich.',
      step_done: 'STEP fertig — der Download startet automatisch.',
      step_error: 'STEP-Bau fehlgeschlagen. Bitte später erneut versuchen.',
      hint2: 'Lädt das angezeigte Modell direkt als druckbare STL — mit angenäherten Verrundungen, genau wie in der Vorschau zu sehen.',
      hint3: '⚖️ Nur für den privaten Gebrauch: Teile des Gates-Systems können patentgeschützt sein — kein gewerblicher Verkauf generierter Ritzel. Unabhängiges Hobby-Projekt ohne Verbindung zu Gates.',
      overlay: 'Vorschau: komplette Geometrie wie im Generator, Verrundungen angenähert dargestellt',
      teeth: 'Zähne',
      angle: 'Winkel (°)',
      center_dist: 'Mitte-Mitte',
      head_d: 'Kopf Ø',
      foot_d: 'Fuß Ø',
      depth: 'Tiefe',
      width_z: 'Breite Z',
      tooth_round: 'Zahn-Rundung',
      guide_width: 'Führung Breite',
      guide_d: 'Führung Ø (0=auto)',
      bore_d: 'Bohrung Ø',
      hub_d: 'Nabe Ø',
      hub_len: 'Nabe Länge',
      bearing_d: 'Lagersitz Ø',
      bearing_depth: 'Lagersitz Tiefe',
      web_width: 'Steg Breite',
      side_depth: 'Tiefe am Steg',
      pocket_width: 'Mulden-Breite',
      pocket_angle: 'Mulden-Winkel',
      pocket_round: 'Mulden-Rundung',
      head_circle: 'Kopfkreis-Ø',
      total_height: 'Gesamthöhe',
      teeth_label: 'Zähne',
      series_ready: 'Fertig gebaut mit Standardwerten und allen Verrundungen — ein Klick, keine Wartezeit.',
      series_modified: 'Vorgebaute verrundete STLs gibt es für die Standardwerte (12–18 Zähne). Deine geänderten Werte brauchen den Cloud-Bau unten.',
      series_out_of_range: 'Vorgebaute STLs gibt es für 12–18 Zähne — andere Zähnezahlen über den Cloud-Bau unten.',
      buegel_show: 'Riemenschutz-Bügel anzeigen',
      buegel_stl: 'Bügel-STL',
      buegel_missing: 'Bügel-Datei für diese Zähnezahl noch nicht exportiert (freecad/export_buegel.py ausführen).',
    },
    en: {
      title: 'Gates CDX Belt-Drive Sprocket Generator (Brompton)',
      subtitle: 'Change values → preview updates instantly · Rotate/zoom view with mouse or finger',
      tab_gen: 'Generator',
      tab_print: 'Print guide',
      leg1: 'Gear Body (Base)',
      leg2: 'Cylinder (Bearing)',
      leg3: 'Side Dirt Shields',
      hint1: 'Tooth and pocket rounding shown approximated in preview; release files contain exact CAD roundings.',
      series_stl: 'Download rounded STL directly',
      series_step: 'Same file as STEP (for CAD)',
      custom_stl: 'Download ZIP (sprocket + guard as STL)',
      step_both: 'Download STEP ZIP (sprocket + guard)',
      step_hint: 'Exact CAD STEP for standard values — sprocket and guard bundled in one ZIP from the release.',
      step_build: '📐 Build STEP for these values (~2–5 min)',
      step_build_hint: 'Builds your custom values via FreeCAD in the cloud and downloads sprocket + guard as a STEP ZIP.',
      step_only_standard: 'Pre-built STEP is only available for standard values. For custom values please use the STL download.',
      step_building: 'Building STEP in the cloud … this usually takes 2–5 min. Please keep this page open.',
      step_queued: 'Queued … the cloud build is starting.',
      step_done: 'STEP ready — the download starts automatically.',
      step_error: 'STEP build failed. Please try again later.',
      hint2: 'Loads the displayed model directly as printable STL — with approximated roundings, exactly as shown in preview.',
      hint3: '⚖️ Private use only: Parts of the Gates system may be patent-protected — no commercial resale of generated sprockets. Independent hobby project without connection to Gates.',
      overlay: 'Preview: complete geometry as in generator, roundings shown approximated',
      teeth: 'Teeth',
      angle: 'Angle (°)',
      center_dist: 'Center-to-center',
      head_d: 'Head Ø',
      foot_d: 'Foot Ø',
      depth: 'Depth',
      width_z: 'Width Z',
      tooth_round: 'Tooth rounding',
      guide_width: 'Guide width',
      guide_d: 'Guide Ø (0=auto)',
      bore_d: 'Bore Ø',
      hub_d: 'Hub Ø',
      hub_len: 'Hub length',
      bearing_d: 'Bearing seat Ø',
      bearing_depth: 'Bearing seat depth',
      web_width: 'Web width',
      side_depth: 'Depth at web',
      pocket_width: 'Pocket width',
      pocket_angle: 'Pocket angle',
      pocket_round: 'Pocket rounding',
      head_circle: 'Head circle Ø',
      total_height: 'Total height',
      teeth_label: 'Teeth',
      series_ready: 'Pre-built with standard values and all roundings — one click, no wait.',
      series_modified: 'Pre-built rounded STLs available for standard values (12–18 teeth). Your modified values need cloud build below.',
      series_out_of_range: 'Pre-built STLs available for 12–18 teeth — other tooth counts via cloud build below.',
      buegel_show: 'Show belt-guard bracket',
      buegel_stl: 'Bracket STL',
      buegel_missing: 'Bracket file for this tooth count not exported yet (run freecad/export_buegel.py).',
    }
  },
};

export function t(key) { return i18n.strings[i18n.lang]?.[key] || key; }

// UI übersetzen (ohne Browser-Sprache neu zu erkennen)
export function updateUI() {
  document.getElementById('html').lang = i18n.lang;
  document.getElementById('title').textContent = t('title');
  document.getElementById('subtitle').textContent = t('subtitle');
  document.getElementById('leg1').textContent = t('leg1');
  document.getElementById('leg2').textContent = t('leg2');
  document.getElementById('leg3').textContent = t('leg3');
  document.getElementById('hint1').textContent = t('hint1');
  document.getElementById('hint2').textContent = t('hint2');
  document.getElementById('hint3').textContent = t('hint3');
  document.getElementById('overlaynote').textContent = t('overlay');
}

// Spracheinstellung aus Browser erkennen (nur beim Laden)
export function initI18n() {
  const browserLang = (navigator.language || navigator.userLanguage || 'de').slice(0, 2).toLowerCase();
  i18n.lang = ['de', 'en'].includes(browserLang) ? browserLang : 'de';
  updateUI();
}
