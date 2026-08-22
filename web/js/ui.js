import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import * as THREE from 'three';
import { t } from './i18n.js';
import { params } from './fields.js';
import { buildMeshes } from './geometry.js';
import { scene, camera, controls, boden, mat } from './scene.js';
import { buegelGeometrie, buegelMaterial } from './buegel.js';
import { makeZip } from './zip.js';

let group = null;
let lastR = 0;

// Riemenschutz-Bügel: eigene, dauerhafte Gruppe. Parametrisch gebaut,
// erscheint sofort und wächst mit der Zähnezahl. Sitzt hinter dem Ritzel.
const buegelGruppe = new THREE.Group();
scene.add(buegelGruppe);

export function aktualisiereBuegel(p) {
  const zeigen = !!document.getElementById('buegelchk')?.checked;
  buegelGruppe.visible = zeigen;
  while (buegelGruppe.children.length) {
    const c = buegelGruppe.children[0];
    buegelGruppe.remove(c); c.geometry?.dispose();
  }
  if (!zeigen) return;
  const geo = buegelGeometrie(p);
  const m = new THREE.Mesh(geo, buegelMaterial);
  m.castShadow = true; m.receiveShadow = true;   // Originalkoordinaten: sitzt zum Ritzel
  buegelGruppe.add(m);
}

// Der STEP-Download (vorgebaute Release-ZIP, nur bei Standardwerten) lebt
// jetzt in step.js und wird von der Shell verdrahtet — er braucht kein 3D
// und funktioniert daher auch, wenn der Viewer nicht geladen ist.

export function rebuild() {
  const p = params();
  if (group) { scene.remove(group); group.traverse(o => o.geometry && o.geometry.dispose()); }
  const { g, rKopf } = buildMeshes(p, mat);
  group = g; scene.add(group);
  boden.position.z = -(Math.max(p.breite, p.nabe_l) / 2 + 2);

  // Kamera-Abstand an die Modellgröße anpassen (Blickrichtung beibehalten)
  if (Math.abs(rKopf - lastR) > 0.5) {
    lastR = rKopf;
    const richtung = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(richtung, rKopf * 4.0);
  }
  document.getElementById('stats').innerHTML =
    `${t('head_circle')}: <b>${(rKopf * 2).toFixed(2)} mm</b> · ` +
    `${t('total_height')}: <b>${Math.max(p.breite, p.nabe_l).toFixed(1)} mm</b> · ` +
    `${t('teeth_label')}: <b>${p.zaehne}</b>`;
  aktualisiereBuegel(p);
}

function stlBytes(object3d) {
  const dv = new STLExporter().parse(object3d, { binary: true });
  return new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
}

function downloadBlob(blob, dateiname) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = dateiname;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Schutzbügel-Geometrie (frisch, unabhängig von der Anzeige-Checkbox).
function buegelMesh() {
  const geo = buegelGeometrie(params());
  return { mesh: new THREE.Mesh(geo, buegelMaterial), geo };
}

// Download: Ritzel UND Schutzbügel gebündelt in EINER ZIP-Datei —
// für Standard- wie angepasste Werte gleich (client-seitig erzeugt).
export function exportStl() {
  if (!group) return;
  const z = params().zaehne;
  const { mesh, geo } = buegelMesh();
  const zip = makeZip([
    { name: `ritzel_z${z}.stl`, data: stlBytes(group) },
    { name: `riemenschutz_z${z}.stl`, data: stlBytes(mesh) },
  ]);
  geo.dispose();
  downloadBlob(new Blob([zip], { type: 'application/zip' }),
    `cdx_ritzel_buegel_z${z}.zip`);
}
