// check-speichen.mjs
// Wacht darueber, dass web/js/speichen.js und freecad/speichen_geometrie.py
// dieselbe Kontur rechnen. Beide Fassungen muessen von Hand gepflegt werden
// (die eine kann kein FreeCAD, die andere kein Python) — driften sie
// auseinander, schneidet die Live-Vorschau etwas anderes als der CAD-Koerper,
// und niemand merkt es, bis eine gedruckte Rolle nicht passt.
//
//   npm run check
//
// Braucht python3 im Pfad. Fehlt es, wird uebersprungen statt zu scheitern.

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ringRadien, kontur, flaeche } from '../web/js/speichen.js';

const WURZEL = dirname(dirname(fileURLToPath(import.meta.url)));

// Raster identisch zu tools/speichen_stichprobe.py
const BASIS = { breite: 11.0, steg_w: 3.0, tiefe: 5.6, seiten_t: 6.0,
                tasche_b: 5.0, mulde_winkel: 35.0, nabe_d: 20.0,
                bohrung_d: 14.0, speichen_wand: 2.0 };
const SPITZEN_ABSTAND = 10.20, SPITZEN_R = 1.40;
const ZAEHNE = [12, 14, 16, 17, 18];
const RUNDUNG = [0, 1, 2, 3, 4, 6];
const NABE_R = [0, 2, 4, 8];
const SCHWUNG = [0, 10, 15, 30];
const ANZAHL = [3, 4, 5, 6, 8];
const BREITE = [3.0, 4.5, 6.0];

function zeilen() {
  const out = [];
  for (const z of ZAEHNE) {
    const rKopf = SPITZEN_ABSTAND / (2 * Math.sin(Math.PI / z)) + SPITZEN_R;
    const { ri, ra } = ringRadien(rKopf, BASIS);
    for (const rd of RUNDUNG)
      for (const sw of SCHWUNG)
        for (const n of ANZAHL)
          for (const b of BREITE)
            for (const rn of NABE_R) {
              const e = kontur(n, b, ri, ra, rd, sw, rn);
              out.push([z, n, b, rd, sw, rn, ri, ra, e.oeffnungen.length,
                        e.schwung, e.rundung, e.rundungNabe,
                        flaeche(e.oeffnungen)]
                .map(x => Number(x).toFixed(4)).join(' '));
            }
  }
  return out;
}

let python;
try {
  python = execFileSync('python3', [join(WURZEL, 'tools', 'speichen_stichprobe.py')],
                        { encoding: 'utf8' }).trimEnd().split('\n');
} catch (e) {
  console.log('⚠ python3 nicht ausfuehrbar — Paritaetspruefung uebersprungen.');
  console.log('  ' + String(e.message).split('\n')[0]);
  process.exit(0);
}

const js = zeilen();
if (python.length !== js.length) {
  console.error(`✗ Unterschiedlich viele Zeilen: Python ${python.length}, JS ${js.length}`);
  console.error('  Die Rasterkonstanten in beiden Dateien muessen gleich sein.');
  process.exit(1);
}

const abweichungen = [];
for (let i = 0; i < js.length; i++)
  if (python[i] !== js[i]) abweichungen.push({ i, py: python[i], js: js[i] });

if (abweichungen.length) {
  console.error(`✗ Speichen-Kontur driftet: ${abweichungen.length} von ${js.length} `
    + 'Kombinationen weichen ab.');
  console.error('  Spalten: zaehne n breite rundung schwung nabe_r ri ra '
    + 'oeffnungen schwung_gebaut rundung_gebaut nabe_gebaut flaeche');
  for (const a of abweichungen.slice(0, 5)) {
    console.error(`\n  #${a.i}  Python: ${a.py}`);
    console.error(`      JavaScript: ${a.js}`);
  }
  if (abweichungen.length > 5)
    console.error(`\n  … und ${abweichungen.length - 5} weitere.`);
  process.exit(1);
}

console.log(`✓ Speichen-Kontur: Python und JavaScript stimmen ueber `
  + `${js.length} Kombinationen ueberein.`);
