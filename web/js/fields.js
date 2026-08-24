import { t } from './i18n.js';
import { ringRadien, kontur } from './speichen.js';

// Harte Zähnezahl-Grenzen (identisch zu zahnrad_params.py: ZAEHNE_MIN/MAX)
export const ZAEHNE_MIN = 12, ZAEHNE_MAX = 18;

// ── Felddefinitionen: identisch zu zahnrad_params.py, Labels als i18n-Keys ────
export const SECTIONS = [
  ['sec1', [
    ['zaehne',          'teeth',           14,   1],
    ['eingriffswinkel', 'angle',      20.0, 0.5],
    ['spitzen_abstand', 'center_dist',     10.20, 0.05],
    ['spitzen_d',       'head_d',           2.80, 0.05],
    ['fuss_d',          'foot_d',            7.00, 0.05],
    ['tiefe',           'depth',            5.60, 0.05],
    ['breite',          'width_z',        11.00, 0.5],
    ['zahn_r',          'tooth_round',     0.40, 0.05],
    ['fuehrung_w',      'guide_width',   1.00, 0.1],
    ['fuehrung_d',      'guide_d', 46.50, 0.5],
  ]],
  ['sec4', [
    ['speichen_n',       'spokes_n',      0,    1],
    ['speichen_b',       'spokes_w',      4.50, 0.1],
    ['speichen_schwung', 'spokes_sweep',  0.00, 1],
    ['speichen_wand',    'spokes_wall',   2.00, 0.1],
    ['speichen_r',       'spokes_round',  2.00, 0.1],
    ['speichen_r_nabe',  'spokes_hub_r',  4.50, 0.1],
  ]],
  ['sec2', [
    ['bohrung_d', 'bore_d',       14.00, 0.5],
    ['nabe_d',    'hub_d',          20.00, 0.5],
    ['nabe_l',    'hub_len',      13.00, 0.5],
    ['lager_d',   'bearing_d',     16.00, 0.5],
    ['lager_t',   'bearing_depth',  1.00, 0.1],
  ]],
  ['sec3', [
    ['steg_w',       'web_width',    3.00, 0.1],
    ['seiten_t',     'side_depth',  6.00, 0.1],
    ['tasche_b',     'pocket_width',  5.00, 0.1],
    ['mulde_winkel', 'pocket_angle', 35.00, 1],
    ['mulde_r',      'pocket_round', 2.00, 0.1],
  ]],
];

export const DEFAULTS = {};
for (const [, felder] of SECTIONS)
  for (const [key,, def] of felder) DEFAULTS[key] = def;

export const inputs = {};

// Schwung und Rundung nimmt die Kontur-Kaskade zurueck, wenn sie nicht in den
// freien Ring passen (siehe speichen.js). Ohne Rueckmeldung sieht das aus, als
// taete das Feld nichts: Eintrag 6, gebaut werden 3,8 — und wer testweise auf 8
// erhoeht, sieht gar keinen Unterschied mehr. Darum den Wert nach der Eingabe
// sichtbar auf das einrasten lassen, was tatsaechlich geschnitten wird.
// Geprueft wird nach JEDER Feldaenderung: auch Zaehnezahl, Nabe oder
// Muldenwinkel verschieben den freien Ring und damit die Obergrenzen.
// Felder, die einrasten: key -> Name im Kontur-Ergebnis.
const RASTFELDER = { speichen_r: 'rundung', speichen_r_nabe: 'rundungNabe',
                     speichen_schwung: 'schwung' };

function gebauteSpeichen(p) {
  const rKopf = p.spitzen_abstand / (2 * Math.sin(Math.PI / p.zaehne)) + p.spitzen_d / 2;
  const { ri, ra } = ringRadien(rKopf, p);
  const e = kontur(p.speichen_n, p.speichen_b, ri, ra, p.speichen_r,
                   p.speichen_schwung, p.speichen_r_nabe);
  return e.oeffnungen.length ? e : null;      // keine Speichen -> nichts einzurasten
}

function einrasten(onChange) {
  const p = params();
  const e = gebauteSpeichen(p);
  if (!e) return;                          // keine Speichen -> nichts einzurasten
  let geaendert = false;
  for (const [key, feld] of Object.entries(RASTFELDER)) {
    const gebaut = e[feld];
    if (Math.abs(gebaut - p[key]) < 0.01) continue;   // nichts zurueckgenommen
    const el = document.getElementById(key);
    if (!el) continue;
    // Zur Null hin abschneiden, damit der angezeigte Wert selbst wieder baubar
    // ist — sonst rastet das Feld bei jeder weiteren Eingabe erneut. Das
    // Epsilon faengt die Fliesskomma-Kruemel des Grad->Bogenmass->Grad-Wegs
    // ab: aus 15.000000000000002 wuerde sonst ein befremdliches 14,99.
    el.value = Math.trunc((gebaut + 1e-9) * 100) / 100;
    geaendert = true;
  }
  if (geaendert) onChange();
}

export function buildFormFields(onChange) {
  for (const [secId, felder] of SECTIONS) {
    const sec = document.getElementById(secId);
    sec.querySelectorAll('.row').forEach(r => r.remove());
    for (const [key, labelKey, def, step] of felder) {
      const row = document.createElement('div'); row.className = 'row';
      const lab = document.createElement('label'); lab.textContent = t(labelKey); lab.htmlFor = key;
      const inp = document.createElement('input');
      inp.type = 'number'; inp.id = key; inp.value = def; inp.step = step;
      if (key === 'zaehne') {
        inp.min = ZAEHNE_MIN; inp.max = ZAEHNE_MAX; inp.step = 1;
        // min/max am <input type=number> begrenzen nur die Pfeil-Buttons,
        // nicht die Tastatureingabe. Darum den Wert beim Verlassen/Bestätigen
        // sichtbar auf [MIN..MAX] einrasten (ganzzahlig), damit die harte
        // Grenze für Nutzer klar erkennbar ist.
        inp.addEventListener('change', () => {
          const v = Math.round(parseFloat(inp.value));
          if (Number.isFinite(v))
            inp.value = Math.min(ZAEHNE_MAX, Math.max(ZAEHNE_MIN, v));
          onChange();
        });
      }
      // Nach dem Zaehne-Handler registrieren, damit dort schon geklemmt wurde.
      inp.addEventListener('change', () => einrasten(onChange));
      inp.addEventListener('input', onChange);
      row.append(lab, inp); sec.append(row);
      inputs[key] = inp;
    }
  }
}

export function params() {
  // Direkt aus dem DOM lesen (nach ID), nicht aus der `inputs`-Map:
  // so liest der Viewer die vom Shell-Bundle gebauten Felder.
  const p = {};
  for (const k in DEFAULTS) {
    const el = document.getElementById(k);
    const v = el ? parseFloat(el.value) : NaN;
    p[k] = Number.isFinite(v) ? v : DEFAULTS[k];
  }
  p.zaehne = Math.min(ZAEHNE_MAX, Math.max(ZAEHNE_MIN, Math.round(p.zaehne)));
  return p;
}
