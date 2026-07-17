// ── Viewer-Bundle ───────────────────────────────────────────────────
// Schwerer Teil: Three.js + Szene + Geometrie + CSG. Wird von shell.js
// im Hintergrund nachgeladen. Sprache und Formularfelder gehören der
// Shell; hier nur das 3D. Verbindung über Globals (__ritzelRebuild /
// __ritzelLangChanged).
import * as THREE from 'three';
import { t } from './i18n.js';
import { renderer, scene, camera, resize, startRenderLoop } from './scene.js';
import { rebuild, exportStl, exportStep } from './ui.js';

// Download: Ritzel + Schutzbügel gebündelt als ZIP
document.getElementById('stlbtn').addEventListener('click', (e) => {
  e.preventDefault();
  exportStl();
});

// STEP (nur Standardwerte): vorgebaute Ritzel- + Bügel-STEP aus dem Release
document.getElementById('stepbtn').addEventListener('click', (e) => {
  e.preventDefault();
  exportStep();
});

// Riemenschutz-Bügel ein-/ausblenden (lädt beim Einschalten das Fertigteil)
document.getElementById('buegelchk')?.addEventListener('change', rebuild);

// Die Shell ruft dies bei jeder Formularänderung (entprellt) auf.
window.__ritzelRebuild = rebuild;

// Die Shell ruft dies nach einem Sprachwechsel auf: Stats + Serien-Buttons
// benutzen t() und müssen neu gezeichnet werden.
window.__ritzelLangChanged = rebuild;

resize();
rebuild();
window.__dbg = { renderer, scene, THREE };
startRenderLoop();

// Lade-Indikator entfernen, sobald das erste Modell steht
document.getElementById('loader')?.remove();
