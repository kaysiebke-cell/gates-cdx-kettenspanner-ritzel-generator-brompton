// golden-test.mjs
// Haelt die zwei Fassungen derselben Geometrie deckungsgleich.
//
// Die Web-Vorschau rechnet in JavaScript, der CAD-Koerper in Python. Beide
// Seiten muessen dieselbe Kontur liefern — sonst zeigt der Konfigurator etwas
// anderes an, als die STEP-Datei enthaelt. Frueher stand dafuer nur ein
// Kommentar ("Formeln 1:1 aus ..."); hier wird es nachgerechnet:
//
//   1. Parameter — Standardwerte und Zaehnezahl-Grenzen beider Seiten
//      (beide sollten aus params.json kommen; wer sie wieder fest eintraegt,
//      faellt hier auf)
//   2. Zahnprofil — web/js/zahnprofil.js  gegen  freecad/zahnprofil.py
//   3. Speichen   — web/js/speichen.js    gegen  freecad/speichen_geometrie.py
//   4. Spannrolle — web/js/rolle.js       gegen  freecad/rolle_geometrie.py
//
// Aufruf: `npm test` (braucht python3, sonst nichts).

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// fields.js holt params.json per `import ... with { type: 'json' }`. Das
// versteht erst Node 20.10 — aeltere Fassungen brechen schon beim Parsen ab,
// mit einem SyntaxError, der nichts ueber die Ursache sagt. Darum die
// Version zuerst pruefen und fields.js erst danach laden (dynamisch, sonst
// zoege der statische Import die Datei vor der Pruefung herein).
const [NODE_MAJOR, NODE_MINOR] = process.versions.node.split('.').map(Number);
if (NODE_MAJOR < 20 || (NODE_MAJOR === 20 && NODE_MINOR < 10)) {
  console.error(
    `\nDieser Abgleich braucht Node 20.10 oder neuer — hier laeuft ${process.versions.node}.`
    + '\nGrund: web/js/fields.js liest params.json ueber Import-Attribute'
    + "\n(`import ... with { type: 'json' }`), die es davor nicht gibt."
    + '\n\nDie Paketquellen von Ubuntu liefern nur Node 18. Neuere Fassung z.B. so:'
    + '\n  curl -fsSL https://fnm.vercel.app/install | bash && fnm install 22'
    + '\nDie gewuenschte Fassung steht in .nvmrc.\n');
  process.exit(1);
}
const { DEFAULTS, ZAEHNE_MIN, ZAEHNE_MAX, defaults } =
  await import('../web/js/fields.js');

import { radien, konturPunkte } from '../web/js/zahnprofil.js';
import { ringRadien, kontur, flaeche, istSinnvoll } from '../web/js/speichen.js';
import { radien as rolleRadien, ringRadien as rolleRing, profil,
         maengel, kantenRadius, vollVolumen } from '../web/js/rolle.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Groesste geduldete Abweichung [mm] bzw. [rad]. Beide Seiten rechnen mit
// denselben Formeln in doppelter Genauigkeit; ein Nanometer laesst nur die
// letzten Bits der Gleitkomma-Arithmetik durch, keine echte Formeldrift.
const TOLERANZ = 1e-9;

// ── Pruef-Faelle: Standardwerte, jeweils gezielt abgewandelt ────────────────
const VARIANTEN = [
  ['Standardwerte',            {}],
  ['kleinstes Rad',            { zaehne: 12 }],
  ['groesstes Rad',            { zaehne: 19 }],
  ['Winkel 0 (scharfe Ecken)', { eingriffswinkel: 0 }],
  ['Winkel 35',                { eingriffswinkel: 35 }],
  ['feine Zahnform',           { spitzen_abstand: 9.5, spitzen_d: 3.4, fuss_d: 6.0, tiefe: 4.9 }],
  ['grobe Zahnform',           { spitzen_abstand: 11.7, spitzen_d: 2.0, fuss_d: 8.25, tiefe: 6.8 }],
  ['Speichen gerade',          { zaehne: 18, speichen_n: 5 }],
  ['Speichen geschwungen',     { zaehne: 18, speichen_n: 5, speichen_schwung: 25 }],
  ['Speichen gegenlaeufig',    { zaehne: 18, speichen_n: 5, speichen_schwung: -25 }],
  ['viele schmale Speichen',   { zaehne: 18, speichen_n: 8, speichen_b: 2.5 }],
  ['breite Speichen',          { zaehne: 18, speichen_n: 6, speichen_b: 6.0, speichen_r: 3.0, speichen_wand: 1.5 }],
  ['dicke Wand am groessten',  { zaehne: 19, speichen_n: 5, speichen_wand: 4.0 }],
  ['knapper Ring (5,97 mm)',   { zaehne: 18, speichen_n: 5, speichen_wand: 3.0 }],
  ['knapper Ring geschwungen', { zaehne: 18, speichen_n: 5, speichen_wand: 3.0, speichen_schwung: 25 }],
  ['Speichen ohne Mulden',     { zaehne: 18, speichen_n: 5, tasche_b: 0 }],
  ['Speichen, Mulde gerade',   { zaehne: 18, speichen_n: 3, mulde_winkel: 0 }],
  ['Speichen, dicke Nabe',     { zaehne: 18, speichen_n: 5, nabe_d: 26, bohrung_d: 20 }],
  ['Ring zu schmal (leer)',    { zaehne: 14, speichen_n: 5 }],
  ['Speichenzahl 0 (aus)',     { zaehne: 18, speichen_n: 0 }],
  // Das Web-Formular laesst krumme Speichenzahlen zu (Schrittweite 1 begrenzt
  // nur die Pfeiltasten). Python schnitt frueher ab, JS rundete — die Vorschau
  // zeigte dann 5 Arme, die STEP-Datei hatte 4.
  ['krumme Speichenzahl ab',   { zaehne: 18, speichen_n: 4.4 }],
  ['krumme Speichenzahl auf',  { zaehne: 18, speichen_n: 4.6 }],
];

const faelle = VARIANTEN.map(([name, abw]) => ({ name, p: { ...DEFAULTS, ...abw } }));

// ── Pruef-Faelle der Spannrolle ────────────────────────────────────────────
// Sie teilt sich das Speichen-Modul mit dem Ritzel, hat aber eigene Radien:
// aussen die Innenkante des Laufkranzes, innen der Nabenrand.
const ROLLE_STD = defaults('rolle');
const ROLLEN_VARIANTEN = [
  ['Standardwerte',            {}],
  ['ohne Speichen',            { speichen_n: 0 }],
  ['acht schmale Speichen',    { speichen_n: 8, speichen_b: 2.5 }],
  ['drei breite Speichen',     { speichen_n: 3, speichen_b: 7.0 }],
  ['kleine Rolle (Ø30)',       { rolle_d: 30 }],              // Ring zu schmal
  ['grosse Rolle (Ø52)',       { rolle_d: 52, speichen_n: 6 }],
  ['dicker Kranz',             { rolle_wand: 6.0 }],
  ['duenner Kranz',            { rolle_wand: 1.5 }],
  ['dicke Nabe',               { nabe_d: 26 }],
  ['schmale Rolle',            { rolle_b: 11.0 }],
  ['Kante groesser als Kranz', { kante_r: 5.0 }],             // wird geklemmt
  ['ohne Lagersitz',           { lager_d: 0, lager_t: 0 }],
  ['Kranz reicht bis zur Nabe', { rolle_d: 24, rolle_wand: 3 }],   // voll, ohne Speichen
  ['kein Kranz ueber der Nabe', { rolle_d: 19 }],                   // unbaubar
  ['Lagersitz zu tief',        { rolle_b: 2.0 }],                // unbaubar
];
const rollenFaelle = ROLLEN_VARIANTEN.map(
  ([name, abw]) => ({ name, p: { ...ROLLE_STD, ...abw } }));

// ── JavaScript-Seite ───────────────────────────────────────────────────────
function jsWerte(p) {
  const r = radien(p);
  const { ri, ra } = ringRadien(r.rKopf, p);
  const speichen = kontur(p.speichen_n, p.speichen_b, ri, ra,
                          p.speichen_r, p.speichen_schwung);
  return {
    radien: [r.rBahn, r.rKopf, r.rFussMin, r.rFussBahn],
    kontur: konturPunkte(p),
    ring: [ri, ra],
    sinnvoll: istSinnvoll(ri, ra, p.speichen_n, p.speichen_b),
    speichen,
    flaeche: flaeche(speichen.oeffnungen),
  };
}

function jsRollenWerte(p) {
  const r = rolleRadien(p);
  const { ri, ra } = rolleRing(p);
  const speichen = kontur(p.speichen_n, p.speichen_b, ri, ra, p.speichen_r, 0);
  return {
    radien: [r.rAussen, r.rKranzInnen, r.rNabe, r.rBohrung, r.rLager],
    ring: [ri, ra],
    sinnvoll: istSinnvoll(ri, ra, p.speichen_n, p.speichen_b),
    speichen,
    flaeche: flaeche(speichen.oeffnungen),
    profil: profil(p),
    maengel: maengel(p),
    kante: kantenRadius(p),
    voll_volumen: vollVolumen(p),
  };
}

// ── Python-Seite ───────────────────────────────────────────────────────────
function pyWerte() {
  const eingabe = JSON.stringify({
    ritzel: faelle.map(f => f.p),
    rolle: rollenFaelle.map(f => f.p),
  });
  try {
    return JSON.parse(execFileSync('python3', [join(root, 'tools/golden_dump.py')],
      { input: eingabe, encoding: 'utf8', maxBuffer: 64 << 20 }));
  } catch (e) {
    console.error('Die Python-Seite liess sich nicht rechnen:\n' + (e.stderr || e.message));
    process.exit(2);
  }
}

// ── Vergleich ──────────────────────────────────────────────────────────────
const abweichungen = [];

function vergleiche(pfad, a, b) {
  if (abweichungen.length >= 20) return;          // Ausgabe nicht fluten
  if (typeof a === 'number' && typeof b === 'number') {
    if (!(Math.abs(a - b) <= TOLERANZ))
      abweichungen.push(`${pfad}: JS ${a} ≠ Python ${b} (Δ ${Math.abs(a - b)})`);
    return;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b))
      return void abweichungen.push(`${pfad}: einmal Liste, einmal nicht`);
    if (a.length !== b.length)
      return void abweichungen.push(`${pfad}: ${a.length} statt ${b.length} Eintraege`);
    a.forEach((x, i) => vergleiche(`${pfad}[${i}]`, x, b[i]));
    return;
  }
  if (a && b && typeof a === 'object') {
    const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    if (ka.join() !== kb.join())
      return void abweichungen.push(`${pfad}: Felder ${ka.join()} statt ${kb.join()}`);
    ka.forEach(k => vergleiche(`${pfad}.${k}`, a[k], b[k]));
    return;
  }
  if (a !== b) abweichungen.push(`${pfad}: JS ${JSON.stringify(a)} ≠ Python ${JSON.stringify(b)}`);
}

const py = pyWerte();

// 1. Parameter
vergleiche('zaehne_min', ZAEHNE_MIN, py.zaehne_min);
vergleiche('zaehne_max', ZAEHNE_MAX, py.zaehne_max);
vergleiche('standardwerte', DEFAULTS, py.standard);
vergleiche('standardwerte_rolle', ROLLE_STD, py.standard_rolle);

// 2. + 3. Geometrie je Fall
let punkte = 0, oeffnungen = 0;
faelle.forEach((f, i) => {
  const js = jsWerte(f.p);
  punkte += js.kontur.length;
  oeffnungen += js.speichen.oeffnungen.length;
  vergleiche(`«${f.name}»`, js, py.faelle[i]);
});

// 4. Spannrolle je Fall
let rollenOeffnungen = 0;
rollenFaelle.forEach((f, i) => {
  const js = jsRollenWerte(f.p);
  rollenOeffnungen += js.speichen.oeffnungen.length;
  vergleiche(`Rolle «${f.name}»`, js, py.rollen_faelle[i]);
});

if (abweichungen.length) {
  console.error('JS- und Python-Fassung driften auseinander:\n');
  for (const a of abweichungen) console.error('  ' + a);
  console.error('\nBeide Dateien eines Paares aendern — oder params.json,'
    + ' wenn es um Standardwerte geht.');
  process.exit(1);
}

console.log(`JS und Python stimmen ueberein: `
  + `${Object.keys(DEFAULTS).length} + ${Object.keys(ROLLE_STD).length} Parameter, `
  + `${faelle.length} Ritzel-Faelle (${punkte} Konturpunkte, ${oeffnungen} Oeffnungen), `
  + `${rollenFaelle.length} Rollen-Faelle (${rollenOeffnungen} Oeffnungen).`);
