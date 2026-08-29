// ── Viewer-Bundle ───────────────────────────────────────────────────
// Schwerer Teil: Three.js + Szene + Geometrie + CSG. Wird von shell.js
// im Hintergrund nachgeladen. Sprache und Formularfelder gehören der
// Shell; hier nur das 3D. Verbindung über Globals (__ritzelRebuild /
// __ritzelLangChanged).
import * as THREE from 'three';
import { t } from './i18n.js';
import { renderer, scene, camera, resize, startRenderLoop } from './scene.js';
import { rebuild, setzeBauteil, exportStl } from './ui.js';

// Download: Ritzel + Schutzbügel gebündelt als ZIP
document.getElementById('stlbtn').addEventListener('click', (e) => {
  e.preventDefault();
  exportStl();
});
// (STEP-Button wird von der Shell verdrahtet — er braucht kein 3D.)

// Riemenschutz-Bügel ein-/ausblenden (lädt beim Einschalten das Fertigteil)
document.getElementById('buegelchk')?.addEventListener('change', rebuild);

// Die Shell ruft dies bei jeder Formularänderung (entprellt) auf.
window.__ritzelRebuild = rebuild;
// Die Shell sagt, welches Bauteil die Vorschau zeigen soll. Sie kann das
// schon tun, bevor dieses Bundle geladen ist — darum holt sich der Viewer
// beim Start die zuletzt gesetzte Wahl nach.
window.__ritzelSetzeBauteil = (id) => { setzeBauteil(id); rebuild(); };
if (window.__ritzelBauteil) setzeBauteil(window.__ritzelBauteil);

// Die Shell ruft dies nach einem Sprachwechsel auf: Stats + Serien-Buttons
// benutzen t() und müssen neu gezeichnet werden.
window.__ritzelLangChanged = rebuild;

resize();
rebuild();
window.__dbg = { renderer, scene, THREE };
startRenderLoop();

// Lade-Indikator entfernen, sobald das erste Modell steht
document.getElementById('loader')?.remove();
