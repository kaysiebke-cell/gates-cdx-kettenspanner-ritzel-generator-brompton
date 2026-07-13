// ── Shell-Bundle ────────────────────────────────────────────────────
// Winziges Sofort-Skript: baut das Formular, setzt Texte, verdrahtet den
// Sprachumschalter – und lädt danach den schweren Three.js-Viewer im
// Hintergrund nach. So erscheint die Bedienoberfläche sofort, statt erst
// nach dem Parsen von ~765 KB Three.js.
import { initI18n, updateUI, t, i18n } from './i18n.js';
import { buildFormFields } from './fields.js';

// Formularänderung → (entprellt) den Viewer neu bauen lassen, sobald da.
let timer = null;
function scheduleRebuild() {
  clearTimeout(timer);
  timer = setTimeout(() => window.__ritzelRebuild && window.__ritzelRebuild(), 120);
}

// Statische Texte, die kein 3D brauchen (Button-Beschriftung).
function setStaticTexts() {
  document.getElementById('stlbtn').textContent = `💾 ${t('custom_stl')}`;
}

initI18n();
buildFormFields(scheduleRebuild);
setStaticTexts();

// Sprachumschalter: Formular + Titel sofort umstellen; der Viewer
// aktualisiert (falls schon geladen) Stats/Serien-Buttons über den Hook.
document.getElementById('lang-toggle').addEventListener('click', () => {
  i18n.lang = i18n.lang === 'de' ? 'en' : 'de';
  updateUI();
  buildFormFields(scheduleRebuild);
  setStaticTexts();
  if (window.__ritzelLangChanged) window.__ritzelLangChanged();
});

// Three.js-Viewer im Hintergrund nachladen. Klassisches <script>, damit
// es auch per Doppelklick (file://) funktioniert.
let viewerLoaded = false;
function loadViewer() {
  if (viewerLoaded) return;
  viewerLoaded = true;
  const s = document.createElement('script');
  s.src = 'js/viewer.bundle.js';
  document.body.appendChild(s);
}
// In sichtbaren Tabs erst nach dem nächsten Paint laden, damit das
// Formular zuerst erscheint. rAF pausiert aber in versteckten Tabs –
// darum ein Timeout als Sicherheitsnetz (feuert überall). Der Guard
// oben sorgt dafür, dass nur einmal geladen wird.
requestAnimationFrame(() => requestAnimationFrame(loadViewer));
setTimeout(loadViewer, 300);
