import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { t } from './i18n.js';
import { params, DEFAULTS } from './fields.js';
import { buildMeshes } from './geometry.js';
import { scene, camera, controls, boden, mat } from './scene.js';

let group = null;
let lastR = 0;

// Vorgebaute, voll verrundete Serie (GitHub-Release "stl-serie"):
// Standardwerte, nur die Zähnezahl variiert
const SERIE_MIN = 12, SERIE_MAX = 22;
const SERIE_URL = (z, endung) =>
  `https://github.com/kaysiebke-cell/gates-cdx-kettenspanner-ritzel-generator-brompton/releases/download/stl-serie/ritzel_z${z}.${endung}`;

function serieAktualisieren(p) {
  const btn = document.getElementById('serienbtn');
  const hint = document.getElementById('serienhint');
  const abweichungen = Object.keys(p).filter(
    k => k !== 'zaehne' && Math.abs(p[k] - DEFAULTS[k]) > 1e-9);
  const passt = abweichungen.length === 0 &&
                p.zaehne >= SERIE_MIN && p.zaehne <= SERIE_MAX;
  const stepBtn = document.getElementById('stepbtn');
  if (passt) {
    btn.style.display = '';
    btn.href = SERIE_URL(p.zaehne, 'stl');
    btn.textContent = `✅ ${t('series_stl')} (${p.zaehne} ${t('teeth_label')})`;
    stepBtn.style.display = '';
    stepBtn.href = SERIE_URL(p.zaehne, 'step');
    stepBtn.textContent = `📐 ${t('series_step')}`;
    hint.textContent = t('series_ready');
  } else {
    btn.style.display = 'none';
    stepBtn.style.display = 'none';
    hint.textContent = abweichungen.length
      ? t('series_modified')
      : t('series_out_of_range');
  }
}

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
  serieAktualisieren(p);
}

export function exportStl() {
  if (!group) return;
  const exporter = new STLExporter();
  const daten = exporter.parse(group, { binary: true });
  const blob = new Blob([daten], { type: 'model/stl' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ritzel_z${params().zaehne}_preview.stl`;
  a.click();
  URL.revokeObjectURL(a.href);
}
