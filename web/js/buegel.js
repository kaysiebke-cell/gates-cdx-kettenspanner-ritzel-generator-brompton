import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';

// Riemenschutz-Bügel — parametrisch als Formel gebaut (wie das Ritzel), damit
// alles einheitlich live gerechnet wird. Aus den echten FreeCAD-Buegeln
// (12–18T) reverse-engineert: feste Form, nur die Laenge waechst mit der
// Zaehnezahl. Koordinaten wie in der FCStd/STL, damit der Buegel zum Ritzel
// sitzt (Auge auf der Ritzelachse im Ursprung, Arm in +Y, Fuss steht in +Z).
// Maße 1:1 aus den echten FCStd-Sketches (Sketch010/012/013/014) ausgelesen.
const B = {
  eye_r:    10.0,   // Auge/Arm-Halbbreite (Sketch010 Bogen R10)
  far_w:     8.0,   // Halbbreite am fernen Armende (Verjuengung 10->8)
  cap_min:   3.06,  // ellipt. Endkappe des Arms (Maj8/Min3,06)
  len_off:   8.0,   // fernes Armende Y = rKopf + len_off (Kappe bringt +3)
  plate_t:   5.0,   // Dicke der Arm-Platte (Z) — Pad007
  plate_z: -14.5,   // Z-Unterkante der Arm-Platte (Oberseite bei -9,5)
  bore_r:    2.70,  // Achsbohrung (Oe 5,4) — durchgehend
  screw_r:   1.70,  // Schrauben-Sackloch Radius (Oe 3,4)
  screw_x:   5.05,  // Schrauben-Sackloch Zentrum X (aus STL gemessen)
  screw_y:   5.03,  // Schrauben-Sackloch Zentrum Y (+Y-Seite, ~45°)
  screw_depth: 3.0, // Tiefe des Sacklochs von HINTEN (nicht durch)
  boss_r:    4.50,  // Auge-Boss Ring aussen (Sketch013)
  boss_h:    2.0,   // Boss-Hoehe (Pad008)
  foot_maj:  8.0,   // Fuss Maj (16 breit, X) — Sketch012
  foot_min:  3.06,  // Fuss runde Kappe (+Y) = Arm-Endkappe
  foot_z0:  -11.5,  // Z-Unterkante des Fusses (Oberkante bleibt bei +7,5)
  foot_h:   19.0,   // Laenge des aufstehenden Fusses (Z) — Pad 19 mm
  foot_inset: 0.0,  // Fuss buendig am Armende (Sketch010-Kappe = Sketch012 bei |Y|=37,19)
};

function rKopfVon(p) {
  const rBahn = p.spitzen_abstand / (2 * Math.sin(Math.PI / p.zaehne));
  return rBahn + p.spitzen_d / 2;
}

export function buegelGeometrie(p) {
  const rKopf = rKopfVon(p);
  const yFar = rKopf + B.len_off;               // waechst mit der Zaehnezahl
  const teile = [];

  // --- Arm-Platte: Umriss in XY, in Z extrudiert (Pad007, 5 mm) ---
  const s = new THREE.Shape();
  s.moveTo(-B.eye_r, 0);
  s.absarc(0, 0, B.eye_r, Math.PI, 2 * Math.PI, false); // Auge: Halbkreis nach -Y
  s.lineTo(B.far_w, yFar);                        // rechte Armkante (verjuengt)
  s.absellipse(0, yFar, B.far_w, B.cap_min, 0, Math.PI, false); // ellipt. Endkappe
  s.lineTo(-B.eye_r, 0);                          // linke Armkante -> schliesst
  const bore = new THREE.Path();                  // zentrale Achsbohrung (durch)
  bore.absarc(0, 0, B.bore_r, 0, Math.PI * 2, true);
  s.holes.push(bore);
  const arm = new THREE.ExtrudeGeometry(s, {
    depth: B.plate_t, bevelEnabled: false, curveSegments: 48,
  });
  arm.translate(0, 0, B.plate_z);
  teile.push(arm);

  // --- Auge-Boss: Ring (r4,5, Bohrung offen) auf der Plattenoberseite ---
  const bs = new THREE.Shape();
  bs.absarc(0, 0, B.boss_r, 0, Math.PI * 2, false);
  const bh = new THREE.Path(); bh.absarc(0, 0, B.bore_r, 0, Math.PI * 2, true);
  bs.holes.push(bh);
  const boss = new THREE.ExtrudeGeometry(bs, {
    depth: B.boss_h, bevelEnabled: false, curveSegments: 40,
  });
  boss.translate(0, 0, B.plate_z + B.plate_t);   // auf die Oberseite (-9,5)
  teile.push(boss);

  // --- Fuss/Schutzwand als D-Form: vorne runde Kappe (+Y), hinten flach
  //     am Armende -> sitzt nur auf der Kappe, kein Wulst auf dem Arm ---
  const fs = new THREE.Shape();
  fs.moveTo(B.foot_maj, 0);
  fs.absellipse(0, 0, B.foot_maj, B.foot_min, 0, Math.PI, false); // +Y-Halbkappe
  fs.lineTo(B.foot_maj, 0);                                       // flache Rueckseite
  const foot = new THREE.ExtrudeGeometry(fs, {
    depth: B.foot_h, bevelEnabled: false, curveSegments: 40,
  });
  foot.translate(0, yFar - B.foot_inset, B.foot_z0);
  teile.push(foot);

  let geo = mergeGeometries(teile);

  // --- Schrauben-Sackloch: 3 mm tief von HINTEN (nicht durch) per CSG ---
  // Zylinder ragt hinten heraus und schneidet screw_depth mm in die Platte.
  const zBack = B.plate_z;                         // Rueckseite der Platte
  const cutH = B.screw_depth + 2;                  // etwas laenger als 3 mm
  const cut = new THREE.CylinderGeometry(B.screw_r, B.screw_r, cutH, 40);
  cut.rotateX(Math.PI / 2);                        // Achse auf Z
  cut.translate(B.screw_x, B.screw_y, zBack + B.screw_depth - cutH / 2);
  geo = evaluator.evaluate(new Brush(geo), new Brush(cut), SUBTRACTION).geometry;

  geo.computeVertexNormals();
  return geo;
}

const evaluator = new Evaluator();
evaluator.useGroups = false;

// Bügel-Optik: mattes Metallgrau, klar vom bronzenen Ritzel unterscheidbar.
export const buegelMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a9099, metalness: 0.25, roughness: 0.55, side: THREE.DoubleSide,
});
