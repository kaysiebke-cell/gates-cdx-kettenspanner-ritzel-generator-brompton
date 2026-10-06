// Prüft, dass die Web-Geometrie wasserdichte Netze liefert: jede Kante gehört
// zu genau zwei Dreiecken. Sonst melden Slicer (Orca, Prusa, Cura) "non-manifold
// edges" und das STL ist unbrauchbar (Reddit-Meldung, Oktober 2026).
//
// Braucht `npm install` (esbuild, three, manifold-3d). Aufruf: npm run test:dicht
import { build } from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const wurzel = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tmp = mkdtempSync(join(tmpdir(), 'dicht-'));
const harness = join(tmp, 'harness.mjs');
writeFileSync(harness, `
import * as THREE from 'three';
import { initCsg } from ${JSON.stringify(join(wurzel, 'web/js/csg.js'))};
import { buildMeshes, rolleMeshes } from ${JSON.stringify(join(wurzel, 'web/js/geometry.js'))};
import { buegelGeometrie } from ${JSON.stringify(join(wurzel, 'web/js/buegel.js'))};
import { defaults } from ${JSON.stringify(join(wurzel, 'web/js/fields.js'))};

function fehlerKanten(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const pos = g.attributes.position.array;
  const key = (i) => [0, 1, 2].map(k => Math.round(pos[i * 3 + k] * 1e3)).join(',');
  const kanten = new Map();
  for (let t = 0; t < pos.length / 9; t++) {
    const v = [0, 1, 2].map(k => key(t * 3 + k));
    if (v[0] === v[1] || v[1] === v[2] || v[0] === v[2]) continue;
    for (let k = 0; k < 3; k++) {
      const a = v[k], b = v[(k + 1) % 3];
      const e = a < b ? a + '|' + b : b + '|' + a;
      kanten.set(e, (kanten.get(e) || 0) + 1);
    }
  }
  let bad = 0; for (const c of kanten.values()) if (c !== 2) bad++;
  return bad;
}

export async function lauf() {
  await initCsg();
  const mat = new THREE.MeshBasicMaterial();
  const faelle = [];
  for (let z = 12; z <= 19; z++) faelle.push([\`Ritzel z\${z}\`, () => buildMeshes({ ...defaults(), zaehne: z }, mat).g.children[0].geometry]);
  faelle.push(['Ritzel z19, 5 Speichen', () => buildMeshes({ ...defaults(), zaehne: 19, speichen_n: 5 }, mat).g.children[0].geometry]);
  faelle.push(['Ritzel z19, geschwungen', () => buildMeshes({ ...defaults(), zaehne: 19, speichen_n: 5, speichen_schwung: 25 }, mat).g.children[0].geometry]);
  faelle.push(['Ritzel ohne Führung', () => buildMeshes({ ...defaults(), fuehrung_d: 0 }, mat).g.children[0].geometry]);
  for (const z of [12, 16, 19]) faelle.push([\`Bügel z\${z}\`, () => buegelGeometrie({ ...defaults(), zaehne: z })]);
  faelle.push(['Rolle', () => rolleMeshes(defaults('rolle'), mat).g.children[0].geometry]);
  faelle.push(['Rolle, 6 Speichen', () => rolleMeshes({ ...defaults('rolle'), speichen_n: 6 }, mat).g.children[0].geometry]);
  return faelle.map(([name, bau]) => [name, fehlerKanten(bau())]);
}
`);
const out = join(tmp, 'harness.bundle.mjs');
await build({
  entryPoints: [harness], bundle: true, platform: 'node', format: 'esm', outfile: out,
  loader: { '.wasm': 'base64' }, alias: { 'three/addons': resolve(wurzel, 'node_modules/three/examples/jsm') },
  absWorkingDir: wurzel, nodePaths: [resolve(wurzel, 'node_modules')], logLevel: 'error',
});
const { lauf } = await import(pathToFileURL(out).href);
const ergebnis = await lauf();
rmSync(tmp, { recursive: true, force: true });

let kaputt = 0;
for (const [name, bad] of ergebnis) {
  console.log(`${bad === 0 ? '✓' : '✗'} ${name}: ${bad} nicht-manifolde Kanten`);
  if (bad) kaputt++;
}
if (kaputt) { console.error(`\n${kaputt} Teil(e) nicht wasserdicht.`); process.exit(1); }
console.log('\nAlle Netze wasserdicht.');
