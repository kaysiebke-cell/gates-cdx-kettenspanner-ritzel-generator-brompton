// ── Shell-Bundle ────────────────────────────────────────────────────
// Winziges Sofort-Skript: baut das Formular, setzt Texte, verdrahtet den
// Sprachumschalter – und lädt danach den schweren Three.js-Viewer im
// Hintergrund nach. So erscheint die Bedienoberfläche sofort, statt erst
// nach dem Parsen von ~765 KB Three.js.
import { initI18n, updateUI, t, i18n } from './i18n.js';
import { buildFormFields } from './fields.js';
import { renderPrint } from './print.js';
import { refreshStepButton, exportStep, initStep } from './step.js';

// Formularänderung → STEP-Button sofort aktualisieren (braucht kein 3D)
// und (entprellt) den Viewer neu bauen lassen, sobald er da ist.
let timer = null;
function onFormChange() {
  refreshStepButton();
  clearTimeout(timer);
  timer = setTimeout(() => window.__ritzelRebuild && window.__ritzelRebuild(), 120);
}

// Statische Texte, die kein 3D brauchen (Button-Beschriftung, Tabs).
function setStaticTexts() {
  document.getElementById('stlbtn').textContent = `💾 ${t('custom_stl')}`;
  document.getElementById('buegellbl').textContent = t('buegel_show');
  document.getElementById('tab-gen').textContent = t('tab_gen');
  document.getElementById('tab-print').textContent = t('tab_print');
  // Druck-Empfehlungen in der aktuellen Sprache einspeisen
  document.getElementById('printview').innerHTML = renderPrint(i18n.lang);
}

// Tab-Umschaltung: Generator-Ansicht (<main>) vs. Druck-Empfehlungen.
function activateTab(name) {
  const gen = name === 'gen';
  document.getElementById('genview').hidden = !gen;
  document.getElementById('printview').hidden = gen;
  const tg = document.getElementById('tab-gen'), tp = document.getElementById('tab-print');
  tg.setAttribute('aria-selected', String(gen));
  tp.setAttribute('aria-selected', String(!gen));
  // Wird die 3D-Ansicht wieder sichtbar, muss der Renderer neu vermessen
  // (der Viewport war ausgeblendet → Größe 0).
  if (gen) dispatchEvent(new Event('resize'));
}
document.getElementById('tab-gen').addEventListener('click', () => activateTab('gen'));
document.getElementById('tab-print').addEventListener('click', () => activateTab('print'));

initI18n();
buildFormFields(onFormChange);
setStaticTexts();
initStep();            // Cloud-Build-Button verdrahten (eigene Werte)
refreshStepButton();   // STEP-Buttons gleich beim Start setzen (ohne 3D)

// STEP-Download aus dem Release: hängt nicht am Viewer, damit er auch auf
// schwachen Handys funktioniert, wo Three.js evtl. nicht lädt.
document.getElementById('stepbtn').addEventListener('click', (e) => {
  e.preventDefault();
  exportStep();
});

// Sprachumschalter: Formular + Titel sofort umstellen; der Viewer
// aktualisiert (falls schon geladen) Stats/Serien-Buttons über den Hook.
document.getElementById('lang-toggle').addEventListener('click', () => {
  i18n.lang = i18n.lang === 'de' ? 'en' : 'de';
  updateUI();
  buildFormFields(onFormChange);
  setStaticTexts();
  refreshStepButton();   // Beschriftung in neuer Sprache
  if (window.__ritzelLangChanged) window.__ritzelLangChanged();
});

// Three.js-Viewer im Hintergrund nachladen. Klassisches <script>, damit
// es auch per Doppelklick (file://) funktioniert.
let viewerLoaded = false;
function loadViewer() {
  if (viewerLoaded) return;
  viewerLoaded = true;
  const s = document.createElement('script');
  s.src = 'js/viewer.bundle.js?v=__V__';   // __V__ wird im Pages-Deploy ersetzt
  document.body.appendChild(s);
}
// In sichtbaren Tabs erst nach dem nächsten Paint laden, damit das
// Formular zuerst erscheint. rAF pausiert aber in versteckten Tabs –
// darum ein Timeout als Sicherheitsnetz (feuert überall). Der Guard
// oben sorgt dafür, dass nur einmal geladen wird.
requestAnimationFrame(() => requestAnimationFrame(loadViewer));
setTimeout(loadViewer, 300);
