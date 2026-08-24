// speichen.js
// Kontur-Mathematik der Speichen-Durchbrüche — Port von
// freecad/speichen_geometrie.py, Formel für Formel identisch. Änderungen
// bitte IMMER in beiden Dateien, sonst driften Vorschau und CAD-Körper.
// Punkte sind [x, y]; ein Segment ist {typ:'linie'|'bogen', ...}.

export const MIN_RING = 6.0;       // freie Ringbreite [mm], ab der gebaut wird
export const MIN_OEFFNUNG = 3.0;   // kleinste Bogenlänge am Innenring [mm]
export const MIN_ARM = 2.0;        // dünnster zulässiger Arm [mm]
export const NABEN_KRAGEN = 1.0;   // stehender Ring an der Nabe [mm], s.u.

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const laenge = a => Math.hypot(a[0], a[1]);
const pol = (r, t) => [r * Math.cos(t), r * Math.sin(t)];
const winkel = a => Math.atan2(a[1], a[0]);

function kreisKreis(c0, r0, c1, r1) {
  const d = laenge(sub(c1, c0));
  if (d < 1e-9 || d > r0 + r1 || d < Math.abs(r0 - r1)) return [];
  const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
  const h2 = r0 * r0 - a * a;
  if (h2 < 0) return [];
  const h = Math.sqrt(h2), e = mul(sub(c1, c0), 1 / d);
  const m = add(c0, mul(e, a)), n = [-e[1], e[0]];
  return [add(m, mul(n, h)), sub(m, mul(n, h))];
}

const naechster = (punkte, ziel) => punkte.length
  ? punkte.reduce((b, p) => laenge(sub(p, ziel)) < laenge(sub(b, ziel)) ? p : b)
  : null;

// Bogen p0->p1 auf dem kurzen Weg. a0/a1 gegen den Uhrzeigersinn sortiert
// (für FreeCAD), `ccw` hält die tatsächliche Durchlaufrichtung fest.
function bogen(mitte, radius, p0, p1) {
  const a0 = winkel(sub(p0, mitte));
  let delta = winkel(sub(p1, mitte)) - a0;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta <= -Math.PI) delta += 2 * Math.PI;
  const ccw = delta > 0;
  return {
    typ: 'bogen', c: mitte, r: radius, p0, p1, ccw,
    a0: ccw ? a0 : a0 + delta, a1: ccw ? a0 + delta : a0,
  };
}
const linie = (p0, p1) => ({ typ: 'linie', p0, p1 });

// ── freier Ring zwischen Nabenkragen und Zahnkranz ────────────────────────
export function ringRadien(rKopf, p) {
  const breite = p.breite, steg = p.steg_w;
  const rFuss = rKopf - p.tiefe;
  const mulden = p.tasche_b > 0 && p.seiten_t > 0 && steg > 0 && steg < breite;
  let grenze = rFuss;
  if (mulden) {
    const rFlach = rKopf - p.seiten_t;
    // Die Mulde wird zur Stirnfläche hin tiefer; erst darunter steht Material
    // über die volle Breite — nur dort darf geschnitten werden.
    const rFace = rFlach - Math.tan(p.mulde_winkel * Math.PI / 180)
      * Math.max(0, breite / 2 - steg / 2);
    grenze = Math.min(rFuss, rFace);
  }
  // `speichen_wand` ist die Wand am ZAHNKRANZ: das Band, das unterhalb des
  // Muldenbodens über die volle Breite steht und die Riemenspannung zwischen
  // den Öffnungen aufnimmt. An der Nabe reicht deutlich weniger — dort läuft
  // die Last über die Übergangsradien der Arme, nicht über den schmalen Ring.
  const wand = p.speichen_wand;
  return {
    ri: Math.max(p.nabe_d, p.bohrung_d) / 2 + Math.min(wand, NABEN_KRAGEN),
    ra: grenze - wand,
  };
}

export function istSinnvoll(ri, ra, anzahl, armB) {
  const n = Math.round(anzahl);
  if (n < 3 || armB < MIN_ARM) return false;
  if (ra - ri < MIN_RING || ri <= armB / 2) return false;
  const offen = ri * (2 * Math.PI / n - 2 * Math.asin(Math.min(1, armB / (2 * ri))));
  return offen >= MIN_OEFFNUNG;
}

// ── Arm-Mittellinie: Gerade (Schwung 0) oder Kreisbogen ───────────────────
function arm(alpha, ri, ra, schwung) {
  if (Math.abs(schwung) < 1e-4)
    return ['linie', pol(1, alpha), pol(1, alpha + Math.PI / 2)];
  const [ax, ay] = pol(ri, alpha);
  const [bx, by] = pol((ri + ra) / 2, alpha + schwung * 0.35);
  const [cx, cy] = pol(ra, alpha + schwung);
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-9)
    return ['linie', pol(1, alpha), pol(1, alpha + Math.PI / 2)];
  const q = (x, y) => x * x + y * y;
  const ux = (q(ax, ay) * (by - cy) + q(bx, by) * (cy - ay) + q(cx, cy) * (ay - by)) / d;
  const uy = (q(ax, ay) * (cx - bx) + q(bx, by) * (ax - cx) + q(cx, cy) * (bx - ax)) / d;
  const mitte = [ux, uy];
  return ['bogen', mitte, laenge(sub([ax, ay], mitte))];
}

// seite = +1: Öffnung liegt beim größeren Polarwinkel, -1: davor.
function flanke(a, seite, armB, ri, ra, schwung, alpha) {
  if (a[0] === 'linie') return ['linie', a[1], a[2], seite * armB / 2, seite];
  const [, mitte, r] = a;
  const pM = pol((ri + ra) / 2, alpha + schwung * 0.35);
  let eT = [-pM[1], pM[0]];
  eT = mul(eT, 1 / (laenge(eT) || 1));                  // tangential, +Winkel
  const probe = add(pM, mul(eT, seite * armB / 2));
  const aussen = laenge(sub(probe, mitte)) > r ? 1 : -1;  // Öffnung außerhalb?
  return ['bogen', mitte, r + aussen * armB / 2, aussen];
}

// Verrundete Ecke zwischen Flanke und Randkreis (Radius rRand um 0).
// randAussen: die Öffnung liegt INNERHALB des Randkreises.
function ecke(fl, rRand, randAussen, rc, referenz) {
  const rZiel = randAussen ? rRand - rc : rRand + rc;
  let x, pF;
  if (fl[0] === 'linie') {
    const [, u, v, d, s] = fl;
    const k = add(mul(u, Math.sqrt(Math.max(rRand * rRand - d * d, 0))), mul(v, d));
    if (rc <= 1e-6) return [k, k, null];
    const dv = d + s * rc, t2 = rZiel * rZiel - dv * dv;
    if (t2 <= 0) return [k, k, null];
    x = add(mul(u, Math.sqrt(t2)), mul(v, dv));
    pF = add(mul(u, dot(x, u)), mul(v, d));             // Lot auf die Flanke
  } else {
    const [, mitte, rF, s] = fl;
    const k = naechster(kreisKreis([0, 0], rRand, mitte, rF), referenz);
    if (!k) return [null, null, null];
    if (rc <= 1e-6) return [k, k, null];
    x = naechster(kreisKreis([0, 0], rZiel, mitte, rF + s * rc), k);
    if (!x) return [k, k, null];
    pF = add(mitte, mul(sub(x, mitte), rF / (laenge(sub(x, mitte)) || 1)));
  }
  return [pF, mul(x, rRand / (laenge(x) || 1)), x];
}

const flankenSegment = (fl, p0, p1) =>
  fl[0] === 'linie' ? linie(p0, p1) : bogen(fl[1], fl[2], p0, p1);

export function kontur(anzahl, armB, ri, ra, rundung, schwungGrad, rundungNabe) {
  const n = Math.round(anzahl);
  const leer = { oeffnungen: [], schwung: 0, rundung: 0, rundungNabe: 0 };
  if (!istSinnvoll(ri, ra, n, armB)) return leer;
  const teilung = 2 * Math.PI / n;

  // `rundung` verrundet die Ecken am Zahnkranz, `rundungNabe` die an der Nabe.
  // Beide sitzen auf derselben Flanke und dürfen sie zusammen nicht
  // auffressen; passt die Summe nicht, werden beide im selben Verhältnis
  // gekürzt (sonst verschöbe sich das gewollte Verhältnis).
  let rdA = Math.max(rundung, 0);
  let rdI = Math.max(rundungNabe === undefined ? rundung : rundungNabe, 0);
  const platz = Math.max(ra - ri - 0.3, 0);
  if (rdA + rdI > platz && platz > 0) {
    const f = platz / (rdA + rdI);
    rdA *= f; rdI *= f;
  }
  rdA = Math.min(rdA, armB); rdI = Math.min(rdI, armB);

  for (const anteil of [1, 0.75, 0.5, 0.25, 0]) {
    const schwung = schwungGrad * Math.PI / 180 * anteil;
    for (const stufe of [1, 0.6, 0.3, 0]) {
      const rcA = rdA * stufe, rcI = rdI * stufe;
      const oeffnungen = versuch(n, teilung, armB, ri, ra, rcA, rcI, schwung);
      if (oeffnungen.length && plausibel(oeffnungen, ri, ra))
        return { oeffnungen, schwung: schwung * 180 / Math.PI,
                 rundung: rcA, rundungNabe: rcI };
    }
    if (Math.abs(schwungGrad) < 1e-4) break;   // radial: Kaskade bringt nichts
  }
  return leer;
}

function versuch(n, teilung, armB, ri, ra, rcA, rcI, schwung) {
  const oeffnungen = [];
  for (let k = 0; k < n; k++) {
    const a0 = teilung * k, a1 = a0 + teilung;
    const fa = flanke(arm(a0, ri, ra, schwung), +1, armB, ri, ra, schwung, a0);
    const fb = flanke(arm(a1, ri, ra, schwung), -1, armB, ri, ra, schwung, a1);
    const ecken = [
      ecke(fa, ra, true,  rcA, pol(ra, a0 + schwung)),
      ecke(fb, ra, true,  rcA, pol(ra, a1 + schwung)),
      ecke(fb, ri, false, rcI, pol(ri, a1)),
      ecke(fa, ri, false, rcI, pol(ri, a0)),
    ];
    if (ecken.some(e => e[0] === null)) return [];
    const [[aOutF, aOutR, aOutM], [bOutF, bOutR, bOutM],
           [bInF, bInR, bInM], [aInF, aInR, aInM]] = ecken;

    // Bleibt von der Flanke nichts übrig, ist die Rundung zu groß: abbrechen
    // und die Kaskade einen kleineren Radius probieren lassen (eine entartete
    // Null-Kante würde das Sketch unbrauchbar machen).
    if (laenge(sub(aOutF, aInF)) < 0.05 || laenge(sub(bOutF, bInF)) < 0.05) return [];

    const seg = [flankenSegment(fa, aInF, aOutF)];      // Flanke A nach außen
    if (aOutM) seg.push(bogen(aOutM, rcA, aOutF, aOutR));
    seg.push(bogen([0, 0], ra, aOutR, bOutR));
    if (bOutM) seg.push(bogen(bOutM, rcA, bOutR, bOutF));
    seg.push(flankenSegment(fb, bOutF, bInF));          // Flanke B nach innen
    if (bInM) seg.push(bogen(bInM, rcI, bInF, bInR));
    seg.push(bogen([0, 0], ri, bInR, aInR));
    if (aInM) seg.push(bogen(aInM, rcI, aInR, aInF));
    oeffnungen.push(seg);
  }
  return oeffnungen;
}

export function flaeche(oeffnungen, punkteJeBogen = 24) {
  let gesamt = 0;
  for (const oef of oeffnungen) {
    const pts = [];
    for (const seg of oef) {
      if (seg.typ === 'linie') { pts.push(seg.p0); continue; }
      const a0 = seg.ccw ? seg.a0 : seg.a1, a1 = seg.ccw ? seg.a1 : seg.a0;
      for (let i = 0; i < punkteJeBogen; i++)
        pts.push(add(seg.c, pol(seg.r, a0 + (a1 - a0) * i / punkteJeBogen)));
    }
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      s += p[0] * q[1] - q[0] * p[1];
    }
    gesamt += Math.abs(s) / 2;
  }
  return gesamt;
}

function plausibel(oeffnungen, ri, ra) {
  const ring = Math.PI * (ra * ra - ri * ri);
  const gesamt = flaeche(oeffnungen);
  if (gesamt < 1 || gesamt > 0.95 * ring) return false;
  for (const oef of oeffnungen) {
    if (flaeche([oef]) < 1) return false;
    for (let i = 0; i < oef.length; i++) {
      const seg = oef[i], folge = oef[(i + 1) % oef.length];
      if (laenge(sub(seg.p1, folge.p0)) > 0.02) return false;
      for (const p of [seg.p0, seg.p1]) {
        const r = laenge(p);
        if (r < ri - 0.02 || r > ra + 0.02) return false;
      }
    }
  }
  return true;
}
