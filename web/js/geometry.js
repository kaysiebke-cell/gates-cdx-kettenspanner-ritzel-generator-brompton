import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Brush, Evaluator, SUBTRACTION, ADDITION } from 'three-bvh-csg';

const dir2 = t => new THREE.Vector2(Math.cos(t), Math.sin(t));

// Zahnprofil — Formeln 1:1 aus zahnrad_generator.py
export function zahnShape(p) {
  const z = p.zaehne, off = (p.eingriffswinkel * Math.PI / 180) * 0.5;
  const rS = p.spitzen_d / 2, rF = p.fuss_d / 2;
  const rBahn = p.spitzen_abstand / (2 * Math.sin(Math.PI / z));
  const rKopf = rBahn + rS;
  const rFussBahn = rKopf - p.tiefe + rF;
  const pts = [], N = 16;
  for (let i = 0; i < z; i++) {
    const wZ = 2 * Math.PI * i / z, wF = 2 * Math.PI * (i + 0.5) / z;
    const cpS = dir2(wZ).multiplyScalar(rBahn);
    const cpF = dir2(wF).multiplyScalar(rFussBahn);
    for (let k = 0; k <= N; k++) {           // Zahnkopf-Bogen (außen)
      const t = wZ - Math.PI / 2 + off + (Math.PI - 2 * off) * k / N;
      pts.push(cpS.clone().addScaledVector(dir2(t), rS));
    }
    for (let k = 0; k <= N; k++) {           // Fußrundung (innen, rückwärts)
      const t = wF + 1.5 * Math.PI - off - (Math.PI - 2 * off) * k / N;
      pts.push(cpF.clone().addScaledVector(dir2(t), rF));
    }
  }
  const shape = new THREE.Shape(pts);
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

  // Ein einziger wasserdichter Körper — sauber für STL/Slicer
  const koerper = new THREE.Mesh(gear, mat);
  koerper.castShadow = true;
  koerper.receiveShadow = true;   // Selbstschattierung in den Mulden
  g.add(koerper);
  return { g, rKopf };
}
