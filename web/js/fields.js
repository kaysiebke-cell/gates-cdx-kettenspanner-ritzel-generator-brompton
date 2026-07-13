import { t } from './i18n.js';

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
    ['fuehrung_d',      'guide_d', 0.00, 0.5],
  ]],
  ['sec2', [
    ['bohrung_d', 'bore_d',       14.00, 0.5],
    ['nabe_d',    'hub_d',          20.00, 0.5],
    ['nabe_l',    'hub_len',      13.00, 0.5],
    ['lager_d',   'bearing_d',     16.00, 0.5],
    ['lager_t',   'bearing_depth',  1.00, 0.1],
  ]],
  ['sec3', [
    ['steg_w',       'web_width',    2.00, 0.1],
    ['seiten_t',     'side_depth',  7.05, 0.1],
    ['tasche_b',     'pocket_width',  4.50, 0.1],
    ['mulde_winkel', 'pocket_angle', 24.00, 1],
    ['mulde_r',      'pocket_round', 1.50, 0.1],
  ]],
];

export const DEFAULTS = {};
for (const [, felder] of SECTIONS)
  for (const [key,, def] of felder) DEFAULTS[key] = def;

export const inputs = {};

export function buildFormFields(onChange) {
  for (const [secId, felder] of SECTIONS) {
    const sec = document.getElementById(secId);
    sec.querySelectorAll('.row').forEach(r => r.remove());
    for (const [key, labelKey, def, step] of felder) {
      const row = document.createElement('div'); row.className = 'row';
      const lab = document.createElement('label'); lab.textContent = t(labelKey); lab.htmlFor = key;
      const inp = document.createElement('input');
      inp.type = 'number'; inp.id = key; inp.value = def; inp.step = step;
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
  p.zaehne = Math.max(6, Math.round(p.zaehne));
  return p;
}
