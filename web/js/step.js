// ── STEP-Download (leichtgewichtig, ohne 3D) ────────────────────────
// STEP kann der Browser nicht selbst erzeugen. Es gibt zwei Quellen:
//
//   1. Standardwerte  → eine vorgebaute ZIP aus dem Release "serie"
//      (Zähne 12–18, sonst Default). Sofort, ein Link.
//   2. Eigene Werte   → On-Demand-Build: ein kleiner Serverless-Vermittler
//      (STEP_API) löst den GitHub-Actions-Build build-ritzel.yml mit genau
//      diesen Parametern aus. Dauert ein paar Minuten, liefert dann Ritzel
//      + Bügel als STEP-ZIP. Ist STEP_API leer, entfällt (2) und es
//      erscheint nur ein Hinweis.
//
// Alles hier hängt nur an fields.js + i18n.js (kein Three.js), damit der
// STEP-Weg auch dann funktioniert, wenn der schwere 3D-Viewer nicht lädt.
import { t } from './i18n.js';
import { params, DEFAULTS } from './fields.js';
import { STEP_API } from './config.js';

// STEP-Serie: Zähne 12–18 bei Standardwerten. Muss zur release-serie.yml passen.
const SERIE_MIN = 12, SERIE_MAX = 18;
const RELEASE_URL = (name) =>
  `https://github.com/kaysiebke-cell/gates-cdx-kettenspanner-ritzel-generator-brompton/releases/download/serie/${name}`;

function istStandard(p) {
  const abw = Object.keys(p).filter(
    k => k !== 'zaehne' && Math.abs(p[k] - DEFAULTS[k]) > 1e-9);
  return abw.length === 0 && p.zaehne >= SERIE_MIN && p.zaehne <= SERIE_MAX;
}

const el = (id) => document.getElementById(id);

// Läuft gerade ein Cloud-Build? Dann Buttons/Status nicht überschreiben.
let building = false;

// Sichtbarkeit + Beschriftung an die aktuellen Formularwerte anpassen.
// Wird von der Shell beim Start und bei jeder Änderung aufgerufen.
export function refreshStepButton() {
  if (building) return;
  const btn = el('stepbtn'), hint = el('stephint');
  const bbtn = el('stepbuildbtn'), bhint = el('stepbuildhint'), status = el('stepbuildstatus');
  if (!btn) return;
  const p = params();
  const standard = istStandard(p);

  // (1) Vorgebaute STEP nur bei Standardwerten.
  btn.style.display = standard ? '' : 'none';
  hint.style.display = standard ? '' : 'none';
  if (standard) {
    btn.textContent = `📐 ${t('step_both')} (${p.zaehne} ${t('teeth_label')})`;
    hint.textContent = t('step_hint');
  }

  // (2) Eigene Werte: Cloud-Build-Button, wenn STEP_API konfiguriert ist;
  //     sonst nur ein erklärender Hinweis.
  if (status) status.style.display = 'none';
  if (standard) {
    if (bbtn) bbtn.style.display = 'none';
    if (bhint) bhint.style.display = 'none';
  } else if (STEP_API) {
    if (bbtn) { bbtn.style.display = ''; bbtn.textContent = t('step_build'); bbtn.disabled = false; }
    if (bhint) { bhint.style.display = ''; bhint.textContent = t('step_build_hint'); }
  } else {
    if (bbtn) bbtn.style.display = 'none';
    if (bhint) { bhint.style.display = ''; bhint.textContent = t('step_only_standard'); }
  }
}

// Vorgebaute STEP für Ritzel + Bügel: direkter Link auf die Release-ZIP.
export function exportStep() {
  const z = params().zaehne;
  const name = `cdx_ritzel_buegel_z${z}_step.zip`;
  const a = document.createElement('a');
  a.href = RELEASE_URL(name);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

// ── On-Demand-STEP für eigene Werte ─────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function setStatus(msg) {
  const status = el('stepbuildstatus');
  if (status) { status.style.display = ''; status.textContent = msg; }
}

async function buildCustomStep() {
  const bbtn = el('stepbuildbtn');
  const p = params();
  building = true;
  if (bbtn) bbtn.disabled = true;
  setStatus(t('step_queued'));
  try {
    // 1) Build auslösen
    const res = await fetch(`${STEP_API}/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: p }),
    });
    if (!res.ok) throw new Error(`build ${res.status}`);
    const { id } = await res.json();
    if (!id) throw new Error('keine ID');

    // 2) Auf Fertigstellung warten (max. ~10 Min)
    setStatus(t('step_building'));
    const bisEnde = Date.now() + 10 * 60 * 1000;
    let fertig = false;
    while (Date.now() < bisEnde) {
      await sleep(6000);
      const s = await fetch(`${STEP_API}/status?id=${encodeURIComponent(id)}`);
      if (!s.ok) continue;
      const info = await s.json();
      if (info.done) {
        if (info.conclusion !== 'success') throw new Error(`build ${info.conclusion}`);
        fertig = true;
        break;
      }
    }
    if (!fertig) throw new Error('timeout');

    // 3) Download anstoßen (der Worker liefert die ZIP mit Content-Disposition)
    setStatus(t('step_done'));
    const a = document.createElement('a');
    a.href = `${STEP_API}/result?id=${encodeURIComponent(id)}`;
    a.download = `cdx_ritzel_buegel_z${p.zaehne}_custom_step.zip`;
    document.body.appendChild(a); a.click(); a.remove();
  } catch (e) {
    console.error('STEP-Build fehlgeschlagen:', e);
    setStatus(t('step_error'));
  } finally {
    building = false;
    if (bbtn) bbtn.disabled = false;
  }
}

// Von der Shell einmal beim Start aufgerufen: Klick-Handler verdrahten.
export function initStep() {
  const bbtn = el('stepbuildbtn');
  if (bbtn) bbtn.addEventListener('click', (e) => { e.preventDefault(); buildCustomStep(); });
}
