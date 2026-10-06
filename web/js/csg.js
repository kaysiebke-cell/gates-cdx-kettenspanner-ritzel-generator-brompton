// ── Boolesche Operationen (Vereinigen / Abziehen) ───────────────────
// Rechnet mit manifold-3d (WebAssembly): das Ergebnis ist garantiert ein
// geschlossener Körper ohne Risse und ohne sich überlappende Flächen.
//
// Vorher kam three-bvh-csg zum Einsatz. Das schneidet Dreiecke an der
// Schnittlinie auf, ohne die Nachbarn mitzuteilen — es bleiben T-Kreuzungen
// (Eckpunkte mitten auf fremden Kanten). Das STL hatte dann zehntausende
// „non-manifold edges“, die Slicer wie Orca nicht reparieren konnten.
import * as THREE from 'three';
import Module from 'manifold-3d';
import wasmBase64 from 'manifold-3d/manifold.wasm';   // esbuild (Lader base64): als Text eingebettet

export const ADDITION = 'add';
export const SUBTRACTION = 'sub';

let M = null;

// Einmal beim Start aufrufen (async: das WebAssembly muss erst instanziiert werden).
export async function initCsg() {
  if (M) return;
  // atob statt Uint8Array.fromBase64: das gibt es erst in sehr neuen Browsern
  const wasmBinary = Uint8Array.from(atob(wasmBase64), (c) => c.charCodeAt(0));
  // locateFile: das Paket baut sonst eine URL aus import.meta.url (im Bundle leer).
  // Die Datei ist eingebettet, der Name wird nie geladen.
  const wasm = await Module({ wasmBinary, locateFile: (f) => f });
  wasm.setup();
  M = wasm;
}
export const csgBereit = () => !!M;

const RASTER = 1e-3;          // mm — Eckpunkte auf 1 µm verschweißen
const MIN_FLAECHE = 1e-9;     // mm² — kleinere Dreiecke sind entartet

// Eckpunkte auf dem 1-µm-Raster verschweißen. Offene Adressierung über
// Ganzzahl-Koordinaten: deutlich schneller als eine Map mit Text-Schlüsseln
// (bei 40.000 Eckpunkten je Aufbau spürbar).
function verschweissen(pos) {
  const n = pos.length / 3;
  let kap = 1; while (kap < n * 2) kap <<= 1;
  const tabelle = new Int32Array(kap).fill(-1);
  const qx = new Int32Array(n), qy = new Int32Array(n), qz = new Int32Array(n);
  const ids = new Uint32Array(n);
  const punkte = [];
  let anzahl = 0;
  for (let i = 0; i < n; i++) {
    const x = Math.round(pos[i * 3] / RASTER), y = Math.round(pos[i * 3 + 1] / RASTER), z = Math.round(pos[i * 3 + 2] / RASTER);
    let h = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) & (kap - 1);
    for (;;) {
      const e = tabelle[h];
      if (e < 0) {
        tabelle[h] = anzahl; qx[anzahl] = x; qy[anzahl] = y; qz[anzahl] = z;
        punkte.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        ids[i] = anzahl++; break;
      }
      if (qx[e] === x && qy[e] === y && qz[e] === z) { ids[i] = e; break; }
      h = (h + 1) & (kap - 1);
    }
  }
  return { punkte, ids };
}

// three.js-Geometrie → Manifold. Eckpunkte verschweißen (ExtrudeGeometry und
// LatheGeometry liefern pro Fläche eigene Punkte) und entartete Dreiecke
// entfernen (die Lathe-Profile doppeln jede Ecke).
function zuManifold(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const { punkte, ids } = verschweissen(g.attributes.position.array);
  const tri = [];
  for (let t = 0; t < ids.length; t += 3) {
    const a = ids[t], b = ids[t + 1], c = ids[t + 2];
    if (a === b || b === c || a === c) continue;
    const ux = punkte[b * 3] - punkte[a * 3], uy = punkte[b * 3 + 1] - punkte[a * 3 + 1], uz = punkte[b * 3 + 2] - punkte[a * 3 + 2];
    const vx = punkte[c * 3] - punkte[a * 3], vy = punkte[c * 3 + 1] - punkte[a * 3 + 1], vz = punkte[c * 3 + 2] - punkte[a * 3 + 2];
    const fl = 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    if (fl > MIN_FLAECHE) tri.push(a, b, c);
  }
  const mesh = new M.Mesh({
    numProp: 3,
    vertProperties: new Float32Array(punkte),
    triVerts: new Uint32Array(tri),
  });
  return new M.Manifold(mesh);     // wirft, wenn das Netz nicht geschlossen ist
}

function zuGeometrie(manifold) {
  const m = manifold.getMesh();
  const n = m.numProp;
  const pos = new Float32Array((m.vertProperties.length / n) * 3);
  for (let i = 0, j = 0; i < m.vertProperties.length; i += n, j += 3) {
    pos[j] = m.vertProperties[i];
    pos[j + 1] = m.vertProperties[i + 1];
    pos[j + 2] = m.vertProperties[i + 2];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(new Uint32Array(m.triVerts), 1));
  return geo;
}

const alsListe = (x) => (Array.isArray(x) ? x : [x]);

// Zwischenergebnis, das im Manifold-Format bleibt. Jede Umwandlung zurück in
// ein three.js-Netz kostet (getMesh) — die Kette Mulden → Führung → Nabe →
// Speichen läuft deshalb komplett in Manifold; erst alsGeometrie() am Ende
// wandelt um.
export class Koerper {
  constructor(manifold) { this.manifold = manifold; }
}

// Geometrie oder Koerper → Manifold (Koerper geben ihr Manifold ab).
function holeManifold(x) {
  if (x instanceof Koerper) { const m = x.manifold; x.manifold = null; return m; }
  const m = zuManifold(x); x.dispose(); return m;
}

// Mehrere Teile zu EINEM Körper vereinigen (auch wenn sie sich überlappen).
export function vereinige(geos) {
  const teile = alsListe(geos).map(holeManifold);
  const r = teile.length === 1 ? teile[0] : M.Manifold.union(teile);
  if (teile.length > 1) teile.forEach(t => t.delete());
  return new Koerper(r);
}

// a ± b. a darf Geometrie oder Koerper sein, b auch eine Liste von Schneidkörpern.
export function csgOp(a, b, op) {
  const ma = holeManifold(a);
  const mb = holeManifold(vereinige(b));
  const r = op === SUBTRACTION ? ma.subtract(mb) : ma.add(mb);
  ma.delete(); mb.delete();
  return new Koerper(r);
}

// Endergebnis als three.js-Geometrie (Geometrien kommen unverändert zurück).
export function alsGeometrie(x) {
  if (!(x instanceof Koerper)) return x;
  const geo = zuGeometrie(x.manifold);
  x.manifold.delete(); x.manifold = null;
  return geo;
}
