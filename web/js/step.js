// ── STEP-Download (leichtgewichtig, ohne 3D) ────────────────────────
// STEP kann der Browser nicht selbst erzeugen: die GitHub-Action baut die
// Serie 12–18 und legt Ritzel- + Bügel-STEP als fertige ZIP ins Release
// "serie". Der Download ist daher nur ein direkter Link — er braucht kein
// Three.js. Damit der Button auch dann funktioniert, wenn der schwere
// Viewer (noch) nicht geladen ist (z. B. auf schwachen Handys), lebt diese
// Logik in der Shell statt im Viewer-Bundle.
import { t } from './i18n.js';
import { params, DEFAULTS } from './fields.js';

// STEP gibt es nur für die vorgebaute Standardserie (Zähne 12–18 bei
// Standardwerten). Muss zur release-serie.yml passen.
const SERIE_MIN = 12, SERIE_MAX = 18;
const RELEASE_URL = (name) =>
  `https://github.com/kaysiebke-cell/gates-cdx-kettenspanner-ritzel-generator-brompton/releases/download/serie/${name}`;

function istStandard(p) {
  const abw = Object.keys(p).filter(
    k => k !== 'zaehne' && Math.abs(p[k] - DEFAULTS[k]) > 1e-9);
  return abw.length === 0 && p.zaehne >= SERIE_MIN && p.zaehne <= SERIE_MAX;
}

// Sichtbarkeit + Beschriftung des STEP-Buttons an die aktuellen Formular-
// werte anpassen. Wird von der Shell bei jeder Änderung aufgerufen.
export function refreshStepButton() {
  const btn = document.getElementById('stepbtn');
  const hint = document.getElementById('stephint');
  if (!btn || !hint) return;
  const p = params();
  const zeigen = istStandard(p);
  btn.style.display = zeigen ? '' : 'none';
  hint.style.display = zeigen ? '' : 'none';
  if (zeigen) {
    btn.textContent = `📐 ${t('step_both')} (${p.zaehne} ${t('teeth_label')})`;
    hint.textContent = t('step_hint');
  }
}

// STEP für Ritzel + Bügel: eine vorgebaute ZIP direkt aus dem Release
// (serverseitig gebündelt — der Browser darf Release-Dateien nicht per
// fetch laden, ein direkter Link geht aber ohne CORS-Problem).
export function exportStep() {
  const z = params().zaehne;
  const name = `cdx_ritzel_buegel_z${z}_step.zip`;
  const a = document.createElement('a');
  a.href = RELEASE_URL(name);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}
