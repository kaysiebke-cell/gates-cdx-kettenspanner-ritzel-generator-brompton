import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Brush, Evaluator, SUBTRACTION, ADDITION } from 'three-bvh-csg';
import { ringRadien, kontur } from './speichen.js';
import { radien, konturPunkte } from './zahnprofil.js';
import { radien as rolleRadien, ringRadien as rolleRing,
         profil as rolleProfilSegmente, maengel } from './rolle.js';

const dir2 = t => new THREE.Vector2(Math.cos(t), Math.sin(t));

// Zahnprofil. Die Kontur-Mathematik steht in zahnprofil.js — dieselben
// Formeln liegen in freecad/zahnprofil.py, `npm test` haelt beide gleich.
export function zahnShape(p) {
  const { rKopf } = radien(p);
  const shape = new THREE.Shape(
    konturPunkte(p).map(([x, y]) => new THREE.Vector2(x, y)));
  if (p.bohrung_d > 0) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, p.bohrung_d / 2, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  return { shape, rKopf };
}

// Schmutzabweiser-Mulde: Trapez-Prisma je Zahnlücke und Seite —
// Geometrie wie _add_schmutztaschen im Generator (r_flach/r_tief, Steg bleibt)
export function muldenGeometrie(p, rKopf) {
  if (p.tasche_b <= 0 || p.seiten_t <= 0) return null;
  const w2 = p.steg_w / 2;
  if (w2 >= p.breite / 2) return null;
  const b2 = p.breite / 2 + 1;         // wie im Generator: sicher durch die Stirnfläche
  const rOut = rKopf + 2;
  // Drehpunkt an der Steg-Kante: seiten_t = Tiefe am Steg,
  // der Winkel macht die Mulde nach außen (Stirnseite) tiefer
  const rFlach = Math.min(rKopf - p.seiten_t, rOut - 0.2);
  const rTief  = Math.max(
    rFlach - Math.tan(p.mulde_winkel * Math.PI / 180) * (b2 - w2), 0.5);

  const teile = [];
  for (const seite of [1, -1]) {
    // Profil in (radial, axial): Boden schräg von (rFlach, Steg) zu (rTief, Stirn).
    // Für die Unterseite Punktreihenfolge umdrehen, damit die Windung
    // gegen den Uhrzeigersinn bleibt (sonst umgestülptes CSG-Volumen).
    const punkte = [
      new THREE.Vector2(rFlach, seite * w2),
      new THREE.Vector2(rOut,   seite * w2),
      new THREE.Vector2(rOut,   seite * b2),
      new THREE.Vector2(rTief,  seite * b2),
    ];
    if (seite < 0) punkte.reverse();
    const prof = new THREE.Shape(punkte);
    // Mulden-Rundung (mulde_r): runder Bevel am Schneidkörper ->
    // die Muldenkanten im Teil werden entsprechend verrundet
    const mr = Math.max(0, Math.min(p.mulde_r, p.tasche_b / 2 - 0.05));
    const tiefe_b = mr > 0.01 ? p.tasche_b - 2 * mr : p.tasche_b;
    const prisma = new THREE.ExtrudeGeometry(prof, mr > 0.01 ? {
      depth: tiefe_b, bevelEnabled: true, bevelSegments: 4,
      bevelSize: mr, bevelThickness: mr, bevelOffset: -mr,
    } : { depth: tiefe_b, bevelEnabled: false });
    prisma.translate(0, 0, -tiefe_b / 2);
    for (let i = 0; i < p.zaehne; i++) {
      const a = 2 * Math.PI * (i + 0.5) / p.zaehne;   // Zahnlücke, nicht Zahn!
      const geo = prisma.clone();
      // lokal: X=radial, Y=Weltachse Z, Z=tangential
      const m = new THREE.Matrix4().makeBasis(
        new THREE.Vector3(Math.cos(a), Math.sin(a), 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(Math.sin(a), -Math.cos(a), 0));
      geo.applyMatrix4(m);
      teile.push(geo);
    }
    prisma.dispose();
  }
  return mergeGeometries(teile);
}

// Speichen-Durchbrüche — Kontur aus speichen.js, identisch zum Generator
// (_add_speichen). Ein Schneidkörper über die volle Breite je Öffnung.
export function speichenGeometrie(p, rKopf) {
  if (!(p.speichen_n >= 3) || !(p.speichen_b > 0)) return null;
  const { ri, ra } = ringRadien(rKopf, p);
  const basis = kontur(p.speichen_n, p.speichen_b, ri, ra,
                       p.speichen_r, p.speichen_schwung);
  if (!basis.oeffnungen.length) return null;
  const weit = aufgeweitet(p, ri, ra, p.breite, basis);
  return weit ? speichenPrismen(weit.oeffnungen, p.breite, weit.kr)
              : speichenPrismen(basis.oeffnungen, p.breite, 0);
}

// Dieselben Durchbrüche für die Spannrolle: andere Radien, sonst nichts.
// Die Rolle kennt keinen Schwung — ihre Arme laufen radial.
export function rolleSpeichen(p) {
  if (!(p.speichen_n >= 3) || !(p.speichen_b > 0)) return null;
  const { ri, ra } = rolleRing(p);
  const basis = kontur(p.speichen_n, p.speichen_b, ri, ra, p.speichen_r, 0);
  if (!basis.oeffnungen.length) return null;
  const weit = aufgeweitet(p, ri, ra, p.rolle_b, basis);
  return weit ? speichenPrismen(weit.oeffnungen, p.rolle_b, weit.kr)
              : speichenPrismen(basis.oeffnungen, p.rolle_b, 0);
}

// Die um `kr` aufgeweitete Öffnung — die Form, die der Schneidkörper an
// seinen Enden haben muss, damit die Kante gerundet erscheint.
//
// Sie entsteht NICHT durch Versetzen der fertigen Kontur nach außen: three.js
// versetzt beim Bevel zuverlässig nur nach innen, nach außen zieht der
// Miter-Join an jeder Ecke eine Zacke — genau die Grafikfehler, die der
// erste Anlauf zeigte. Stattdessen kommt sie aus derselben Formel wie die
// normale Öffnung, nur mit schmaleren Armen, weiterem Ring und größerer
// Eckenrundung. Das IST die aufgeweitete Öffnung, und der Bevel versetzt
// sie anschließend nach innen auf die eigentliche Kontur zurück.
function aufgeweitet(p, ri, ra, dicke, basis) {
  const gewuenscht = Math.max(0, Math.min(p.speichen_kante || 0,
                                          dicke / 2 - 0.05,
                                          p.speichen_b / 2 - 0.2,
                                          (ra - ri) / 4));
  if (!(gewuenscht > 0.01)) return null;

  // Die aufgeweitete Kontur muss die Basiskontur um GENAU kr nach aussen
  // versetzt sein — sonst landet der Bevel beim Zurueckschrumpfen neben der
  // echten Oeffnung und knickt die Wand. Genau das passiert bei zu grossem
  // Radius: kontur() deckelt die Eckenrundung auf die Armbreite, und die ist
  // in der aufgeweiteten Fassung um 2*kr schmaler. Die Rundung waechst dann
  // nicht um kr mit, und der Versatz stimmt an jeder Ecke nicht mehr.
  //
  // Darum wird geprueft, nicht gehofft: die zurueckgelieferte Rundung muss um
  // kr ueber der Basis liegen und der Schwung derselbe sein. Passt es nicht,
  // wird kr kleiner — lieber eine kleinere Rundung zeigen als eine falsche.
  for (const faktor of [1, 0.85, 0.7, 0.55, 0.4, 0.25]) {
    const kr = gewuenscht * faktor;
    if (kr < 0.02) break;
    const weit = kontur(p.speichen_n, p.speichen_b - 2 * kr, ri - kr, ra + kr,
                        basis.rundung + kr, basis.schwung);   // Schwung in Grad
    if (weit.oeffnungen.length
        && Math.abs(weit.rundung - (basis.rundung + kr)) < 1e-6
        && Math.abs(weit.schwung - basis.schwung) < 1e-6)
      return { kr, oeffnungen: weit.oeffnungen };
  }
  return null;
}

// Ein Schneidkörper je Öffnung, über die volle Breite `dicke`.
//
// Bei `kante` > 0 ist `oeffnungen` bereits die AUFGEWEITETE Kontur (siehe
// aufgeweitet()), und der Bevel schrumpft sie als Viertelkreis über die
// Strecke `kante` zurück auf die eigentliche Öffnung: an der Stirnfläche ist
// der Schneidkörper um `kante` weiter, in der Mitte auf Kontur. Was er
// dabei zusätzlich wegnimmt, ist die Rundung der Öffnungskante.
function speichenPrismen(oeffnungen, dicke, kante = 0) {
  // Ohne Rundung ragt der Schneidkörper beidseitig 1 mm heraus — sicher
  // durch beide Stirnflächen. Mit Rundung muss der Bevel dagegen genau an
  // ihnen sitzen: einen Millimeter weiter draußen liefe er ins Leere und
  // die Kante bliebe scharf.
  const kr = kante || 0;
  const tiefe = kr > 0.01 ? dicke - 2 * kr : dicke + 2;
  // Genau bündig darf er aber auch nicht enden. Der Viertelkreis läuft an
  // seiner Deckfläche WAAGERECHT aus; bündig gesetzt berührt er die
  // Stirnfläche über die ganze Kurve, statt sie zu schneiden — der
  // schlimmste Fall für die CSG. Gemessen: 2,7 s ohne Rundung, über 100 s
  // mit, und ausgefranste Ränder. Ein Überstand von 30 % des Radius stutzt
  // den flachsten Teil der Kurve weg, sodass sie die Stirnfläche in rund
  // 45° schneidet. Was bleibt, ist der sichtbare Teil der Rundung.
  const ueberstand = kr > 0.01 ? Math.max(0.05, 0.30 * kr) : 0;
  const teile = [];
  for (const oef of oeffnungen) {
    const shape = new THREE.Shape();
    shape.moveTo(oef[0].p0[0], oef[0].p0[1]);
    for (const seg of oef) {
      if (seg.typ === 'linie') { shape.lineTo(seg.p1[0], seg.p1[1]); continue; }
      // a0/a1 sind gegen den Uhrzeigersinn sortiert; `ccw` sagt, wie der
      // Umlauf tatsächlich läuft — sonst zieht die Kurve die falsche Seite.
      shape.absarc(seg.c[0], seg.c[1], seg.r,
                   seg.ccw ? seg.a0 : seg.a1,
                   seg.ccw ? seg.a1 : seg.a0, !seg.ccw);
    }
    const geo = new THREE.ExtrudeGeometry(shape, kr > 0.01 ? {
      depth: tiefe, curveSegments: 24,
      bevelEnabled: true, bevelSegments: 4,
      bevelSize: -kr, bevelThickness: kr, bevelOffset: 0,
    } : { depth: tiefe, bevelEnabled: false, curveSegments: 24 });
    geo.translate(0, 0, -tiefe / 2);
    if (ueberstand > 0) geo.scale(1, 1, (dicke + 2 * ueberstand) / dicke);
    teile.push(geo);
  }
  return mergeGeometries(teile);
}

const evaluator = new Evaluator();
evaluator.useGroups = false;   // ein Material für das Ergebnis, keine Gruppen

function csgOp(geoA, geoB, op) {
  const a = new Brush(geoA); a.updateMatrixWorld();
  const b = new Brush(geoB); b.updateMatrixWorld();
  const ergebnis = evaluator.evaluate(a, b, op);
  geoA.dispose(); geoB.dispose();
  return ergebnis.geometry;
}

export function buildMeshes(p, mat) {
  const g = new THREE.Group();
  const { shape, rKopf } = zahnShape(p);

  // Grundkörper — Zahn-Rundung (zahn_r) als runder Bevel an beiden
  // Stirnflächen-Kanten, wie die ZahnVerrundung im Generator
  const zr = Math.max(0, Math.min(p.zahn_r, p.breite / 2 - 0.05));
  let gear;
  if (zr > 0.01) {
    gear = new THREE.ExtrudeGeometry(shape, {
      depth: p.breite - 2 * zr, curveSegments: 24,
      bevelEnabled: true, bevelSegments: 4,
      bevelSize: zr, bevelThickness: zr, bevelOffset: -zr,
    });
    gear.translate(0, 0, -(p.breite - 2 * zr) / 2);
  } else {
    gear = new THREE.ExtrudeGeometry(shape, { depth: p.breite, bevelEnabled: false, curveSegments: 24 });
    gear.translate(0, 0, -p.breite / 2);
  }

  // Mulden per CSG abziehen — wie die Pocket-Schleife im Generator
  const mulden = muldenGeometrie(p, rKopf);
  if (mulden) gear = csgOp(gear, mulden, SUBTRACTION);

  // Riemenführung: z-Eck (Ecken auf den Zähnen), Loch = Nabe
  if (p.fuehrung_w > 0) {
    const rG = p.fuehrung_d > 0 ? p.fuehrung_d / 2 : rKopf - 1.1;
    const poly = [];
    for (let i = 0; i < p.zaehne; i++)
      poly.push(dir2(2 * Math.PI * i / p.zaehne).multiplyScalar(rG));
    const fs = new THREE.Shape(poly);
    const inner = Math.max(p.nabe_d, p.bohrung_d) / 2;
    if (inner > 0) {
      const hole = new THREE.Path();
      hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
      fs.holes.push(hole);
    }
    const fg = new THREE.ExtrudeGeometry(fs, { depth: p.fuehrung_w, bevelEnabled: false, curveSegments: 24 });
    fg.translate(0, 0, -p.fuehrung_w / 2);
    gear = csgOp(gear, fg, ADDITION);
  }

  // Nabe mit Bohrung + Lagersitz-Senkungen: Drehteil (Lathe).
  // Jede Ecke doppelt einfügen: sonst mittelt Three.js die Normalen
  // über die Kante und der Zylinder wirkt abgerundet statt scharfkantig.
  if (p.nabe_d > 0 && p.nabe_l > 0) {
    const R = p.nabe_d / 2, rB = Math.max(p.bohrung_d / 2, 0.1);
    const rS_ = Math.max(p.lager_d / 2, rB), t = Math.min(p.lager_t, p.nabe_l / 2), L = p.nabe_l / 2;
    // Reihenfolge ist bewusst SO herum: andersherum zeigt die Hülle nach
    // innen (negatives Volumen) und das STL ist umgestülpt.
    const ecken = [
      [rS_, L - t], [rB, L - t], [rB, -L + t], [rS_, -L + t],
      [rS_, -L], [R, -L], [R, L], [rS_, L],
    ];
    const prof = [];
    for (let i = 0; i < ecken.length; i++) {
      const [r1, z1] = ecken[i], [r2, z2] = ecken[(i + 1) % ecken.length];
      prof.push(new THREE.Vector2(r1, z1), new THREE.Vector2(r2, z2));
    }
    const lathe = new THREE.LatheGeometry(prof, 64);
    lathe.rotateX(Math.PI / 2);   // Lathe dreht um Y → auf Z-Achse kippen
    gear = csgOp(gear, lathe, ADDITION);
  }

  // Speichen zuletzt schneiden — nach Führungsring und Nabe. Andersherum
  // legt der Führungsring (geschlossene Scheibe bis zur Nabe) eine dünne
  // Haut über jede Öffnung, die beim flachen Druck in der Luft hinge.
  const speichen = speichenGeometrie(p, rKopf);
  if (speichen) gear = csgOp(gear, speichen, SUBTRACTION);

  // Ein einziger wasserdichter Körper — sauber für STL/Slicer
  const koerper = new THREE.Mesh(gear, mat);
  koerper.castShadow = true;
  koerper.receiveShadow = true;   // Selbstschattierung in den Mulden
  g.add(koerper);
  return { g, rKopf };
}

// ── Spannrolle ─────────────────────────────────────────────────────────────
// Ein Drehteil: rolle.js liefert den Querschnitt als Linien und Kreisbögen —
// dieselben Segmente, aus denen FreeCAD den CAD-Körper dreht. Hier werden die
// Bögen in Punkte zerlegt, weil LatheGeometry nur Punkte kennt; im STEP
// bleiben es echte Radien.
const BOGEN_PUNKTE = 6;

export function rolleProfil(p) {
  const pts = [];
  for (const seg of rolleProfilSegmente(p)) {
    if (seg.typ === 'linie') { pts.push(seg.p0, seg.p1); continue; }
    for (let i = 0; i <= BOGEN_PUNKTE; i++) {
      const a = seg.a0 + (seg.a1 - seg.a0) * (i / BOGEN_PUNKTE);
      pts.push([seg.c[0] + seg.r * Math.cos(a), seg.c[1] + seg.r * Math.sin(a)]);
    }
  }
  return pts;
}

export function rolleMeshes(p, mat) {
  const g = new THREE.Group();
  const r = rolleRadien(p);

  // Unbaubare Kombinationen (Kranz unter der Nabe, Lagersitz zu tief …)
  // erkennt rolle.js. Dann bleibt die Vorschau leer statt zu entgleisen.
  if (maengel(p).length) return { g, rKopf: Math.max(r.rAussen, 1) };

  const ecken = rolleProfil(p);
  const prof = [];
  for (let i = 0; i < ecken.length; i++) {
    const [r1, z1] = ecken[i], [r2, z2] = ecken[(i + 1) % ecken.length];
    prof.push(new THREE.Vector2(r1, z1), new THREE.Vector2(r2, z2));
  }
  let koerper = new THREE.LatheGeometry(prof, 96);
  koerper.rotateX(Math.PI / 2);        // Lathe dreht um Y → auf die Z-Achse kippen

  const speichen = rolleSpeichen(p);
  if (speichen) koerper = csgOp(koerper, speichen, SUBTRACTION);

  const mesh = new THREE.Mesh(koerper, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return { g, rKopf: r.rAussen };
}
