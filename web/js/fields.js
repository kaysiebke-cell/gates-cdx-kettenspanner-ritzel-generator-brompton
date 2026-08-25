import { t } from './i18n.js';
// Eingabefelder, Standardwerte und Zähnezahl-Grenzen kommen aus der
// gemeinsamen Quelle params.json — dieselbe Datei liest auch
// freecad/zahnrad_params.py. esbuild bettet den Inhalt beim Bauen ins
// Bundle ein, der Browser lädt also nichts nach (siehe package.json).
import PARAMS from '../../params.json' with { type: 'json' };

// Harte Zähnezahl-Grenzen.
export const ZAEHNE_MIN = PARAMS.zaehne_min, ZAEHNE_MAX = PARAMS.zaehne_max;

// ── Felddefinitionen ────────────────────────────────────────────────────────
// Form je Abschnitt: [fieldset-Id, [ [key, i18n-Schlüssel, Standard, Schritt] ]]
export const SECTIONS = PARAMS.abschnitte.map(
  a => [a.id, a.felder.map(f => [f.key, f.i18n, f.standard, f.schritt])]);

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
