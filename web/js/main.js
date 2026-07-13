import * as THREE from 'three';
import { initI18n, t } from './i18n.js';
import { buildFormFields } from './fields.js';
import { renderer, scene, camera, resize, startRenderLoop } from './scene.js';
import { rebuild, scheduleRebuild, toggleLanguage, exportStl } from './ui.js';

// stats/STL-Export
document.getElementById('stlbtn').addEventListener('click', (e) => {
  e.preventDefault();
  exportStl();
});

// Sprachschalter
document.getElementById('lang-toggle').addEventListener('click', toggleLanguage);

// Initialisierung
initI18n();
buildFormFields(scheduleRebuild);
document.getElementById('stlbtn').textContent = `💾 ${t('custom_stl')}`;

resize();
rebuild();
window.__dbg = { renderer, scene, THREE };
startRenderLoop();

// Lade-Indikator entfernen, sobald das erste Modell steht
document.getElementById('loader')?.remove();
