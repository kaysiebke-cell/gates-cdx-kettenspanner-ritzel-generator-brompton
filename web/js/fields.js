import { t } from './i18n.js';
// Bauteile, Eingabefelder, Standardwerte und Grenzen kommen aus der
// gemeinsamen Quelle params.json — dieselbe Datei liest auch
// freecad/zahnrad_params.py. esbuild bettet den Inhalt beim Bauen ins
// Bundle ein, der Browser lädt also nichts nach (siehe package.json).
import PARAMS from '../../params.json' with { type: 'json' };

// ── Bauteile ───────────────────────────────────────────────────────────────
// Jedes Bauteil bringt seine eigenen Abschnitte mit. Im Formular steht immer
// nur EINES davon — deshalb dürfen sich Ritzel und Rolle Feldnamen teilen
// (bohrung_d heißt bei beiden dasselbe).
const NACH_ID = Object.fromEntries(PARAMS.bauteile.map(b => [b.id, b]));
export const BAUTEILE = PARAMS.bauteile.map(
  ({ id, i18n, de }) => ({ id, i18n, de }));
export const STANDARD_BAUTEIL = PARAMS.bauteile[0].id;

const teil = (bauteil) => NACH_ID[bauteil] || NACH_ID[STANDARD_BAUTEIL];

// ── Felddefinitionen ───────────────────────────────────────────────────────
// Form je Abschnitt: [fieldset-Id, [ [key, i18n-Schlüssel, Standard, Schritt] ]]
export function sections(bauteil = STANDARD_BAUTEIL) {
  return teil(bauteil).abschnitte.map(
    a => [a.id, a.felder.map(f => [f.key, f.i18n, f.standard, f.schritt])]);
}

export function defaults(bauteil = STANDARD_BAUTEIL) {
  const d = {};
  for (const [, felder] of sections(bauteil))
    for (const [key,, def] of felder) d[key] = def;
  return d;
}

// Zähnegrenzen hat nur das Ritzel; für Bauteile ohne Zähne ist es null.
export function grenzen(bauteil = STANDARD_BAUTEIL) {
  const b = teil(bauteil);
  return b.zaehne_min === undefined
    ? null : { min: b.zaehne_min, max: b.zaehne_max };
}

// Bisherige Namen bleiben gültig: sie meinen das erste Bauteil (Ritzel).
export const SECTIONS = sections();
export const DEFAULTS = defaults();
export const ZAEHNE_MIN = grenzen().min, ZAEHNE_MAX = grenzen().max;

export const inputs = {};

export function buildFormFields(onChange, bauteil = STANDARD_BAUTEIL) {
  const g = grenzen(bauteil);
  for (const key in inputs) delete inputs[key];

  // Erst die Zeilen ALLER Bauteile wegräumen, nicht nur die des eigenen:
  // Ritzel und Rolle teilen sich Feldnamen (speichen_n, bohrung_d …).
  // Bliebe das versteckte Feld des anderen Bauteils stehen, stünde dieselbe
  // id zweimal im DOM — und getElementById() in params() läse das falsche.
  for (const b of PARAMS.bauteile)
    for (const a of b.abschnitte) {
      const sec = document.getElementById(a.id);
      if (sec) sec.querySelectorAll('.row').forEach(r => r.remove());
    }

  for (const [secId, felder] of sections(bauteil)) {
    const sec = document.getElementById(secId);
    // Fehlt das fieldset im HTML, hat diese Seite den Abschnitt nicht —
    // still überspringen statt am fehlenden Element zu scheitern.
    if (!sec) continue;
    for (const [key, labelKey, def, step] of felder) {
      const row = document.createElement('div'); row.className = 'row';
      const lab = document.createElement('label'); lab.textContent = t(labelKey); lab.htmlFor = key;
      const inp = document.createElement('input');
      inp.type = 'number'; inp.id = key; inp.value = def; inp.step = step;
      if (key === 'zaehne' && g) {
        inp.min = g.min; inp.max = g.max; inp.step = 1;
        // min/max am <input type=number> begrenzen nur die Pfeil-Buttons,
        // nicht die Tastatureingabe. Darum den Wert beim Verlassen/Bestätigen
        // sichtbar auf [MIN..MAX] einrasten (ganzzahlig), damit die harte
        // Grenze für Nutzer klar erkennbar ist.
        inp.addEventListener('change', () => {
          const v = Math.round(parseFloat(inp.value));
          if (Number.isFinite(v))
            inp.value = Math.min(g.max, Math.max(g.min, v));
          onChange();
        });
      }
      inp.addEventListener('input', onChange);
      row.append(lab, inp); sec.append(row);
      inputs[key] = inp;
    }
  }
}

export function params(bauteil = STANDARD_BAUTEIL) {
  // Direkt aus dem DOM lesen (nach ID), nicht aus der `inputs`-Map:
  // so liest der Viewer die vom Shell-Bundle gebauten Felder.
  const std = defaults(bauteil);
  const p = {};
  for (const k in std) {
    const el = document.getElementById(k);
    const v = el ? parseFloat(el.value) : NaN;
    p[k] = Number.isFinite(v) ? v : std[k];
  }
  const g = grenzen(bauteil);
  if (g) p.zaehne = Math.min(g.max, Math.max(g.min, Math.round(p.zaehne)));
  return p;
}
