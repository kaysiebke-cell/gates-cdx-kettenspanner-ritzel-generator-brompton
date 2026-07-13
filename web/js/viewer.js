// ── Viewer-Bundle ───────────────────────────────────────────────────
// Schwerer Teil: Three.js + Szene + Geometrie + CSG. Wird von shell.js
// im Hintergrund nachgeladen. Sprache und Formularfelder gehören der
// Shell; hier nur das 3D. Verbindung über Globals (__ritzelRebuild /
// __ritzelLangChanged).
import * as THREE from 'three';
import { t } from './i18n.js';
import { renderer, scene, camera, resize, startRenderLoop } from './scene.js';
import { rebuild, exportStl } from './ui.js';

// STL-Export
document.getElementById('stlbtn').addEventListener('click', (e) => {
  e.preventDefault();
  exportStl();
});

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
