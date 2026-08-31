// ── Shell-Bundle ────────────────────────────────────────────────────
// Winziges Sofort-Skript: baut das Formular, setzt Texte, verdrahtet den
// Sprachumschalter – und lädt danach den schweren Three.js-Viewer im
// Hintergrund nach. So erscheint die Bedienoberfläche sofort, statt erst
// nach dem Parsen von ~765 KB Three.js.
import { initI18n, updateUI, t, i18n } from './i18n.js';
import { buildFormFields, BAUTEILE } from './fields.js';
import { renderPrint } from './print.js';
import { refreshStepButton, exportStep, initStep } from './step.js';

// Formularänderung → STEP-Button sofort aktualisieren (braucht kein 3D)
// und (entprellt) den Viewer neu bauen lassen, sobald er da ist.
// ── Bauteil ────────────────────────────────────────────────────────────────
// Ritzel und Rolle teilen sich Formular und Vorschau; sichtbar ist immer
// nur eines. Welche fieldsets zu welchem Bauteil gehören, steht in
// params.json — hier wird nur ein- und ausgeblendet.
const GRUPPEN = {
  ritzel: ['sec1', 'sec4', 'sec2', 'sec3'],
  rolle:  ['rsec1', 'rsec2', 'rsec3'],
};
let bauteil = 'ritzel';

function zeigeBauteil(id) {
  bauteil = BAUTEILE.some(b => b.id === id) ? id : 'ritzel';
  for (const [teil, ids] of Object.entries(GRUPPEN))
    for (const secId of ids) {
      const sec = document.getElementById(secId);
      if (sec) sec.hidden = teil !== bauteil;
    }
  // Bügel und sein Kästchen gehören zum Ritzel.
  const brow = document.getElementById('buegelrow');
  if (brow) brow.hidden = bauteil !== 'ritzel';
  buildFormFields(onFormChange, bauteil);
  window.__ritzelBauteil = bauteil;   // falls der Viewer noch lädt
  if (window.__ritzelSetzeBauteil) window.__ritzelSetzeBauteil(bauteil);
  refreshStepButton(bauteil);
  if (window.__ritzelRebuild) window.__ritzelRebuild();
}

let timer = null;
function onFormChange() {
  refreshStepButton(bauteil);
  clearTimeout(timer);
  timer = setTimeout(() => window.__ritzelRebuild && window.__ritzelRebuild(), 120);
}

// ── Erklärtexte ein-/ausklappen ─────────────────────────────────────
// Die .hint-Bloecke stehen dort, wo sie hingehoeren, bleiben aber
// eingeklappt: dauerhaft sichtbar kosten sie im schmalen Formular mehr
// Platz als das Formular selbst. Der ⓘ-Schalter in der Kopfzeile klappt
// alle auf einmal auf; die Wahl haelt bis zum naechsten Besuch.
// Nicht betroffen: der Status des Cloud-Baus (.status) und der
// rechtliche Hinweis (.legal) — die stehen immer.
const HINWEIS_SCHLUESSEL = 'ritzel.hinweise';

// localStorage kann werfen (privates Fenster, gesperrter Speicher in der
// WebView) — dann laeuft die Seite eben ohne Gedaechtnis weiter.
function geladen() {
  try { return localStorage.getItem(HINWEIS_SCHLUESSEL) === '1'; } catch { return false; }
}
function merke(an) {
  try { localStorage.setItem(HINWEIS_SCHLUESSEL, an ? '1' : '0'); } catch { /* egal */ }
}

let hinweiseAn = geladen();

// Klasse, Knopfzustand und Beschriftung in einem — wird auch beim
// Sprachwechsel wieder aufgerufen.
function setzeHinweise(an) {
  hinweiseAn = an;
  document.body.classList.toggle('hinweise', an);
  const b = document.getElementById('hintsbtn');
  if (!b) return;
  const text = t(an ? 'hints_hide' : 'hints_show');
  b.setAttribute('aria-pressed', String(an));
  b.setAttribute('aria-label', text);
  b.title = text;
}

// Statische Texte, die kein 3D brauchen (Button-Beschriftung, Tabs).
function setStaticTexts() {
  document.getElementById('stlbtn').textContent =
    bauteil === 'rolle' ? `💾 ${t('roller_stl')}` : `💾 ${t('custom_stl')}`;
  document.getElementById('buegellbl').textContent = t('buegel_show');
  document.getElementById('tab-gen').textContent = t('tab_gen');
  document.getElementById('tab-rolle').textContent = t('tab_rolle');
  document.getElementById('tab-print').textContent = t('tab_print');
  // Install-Button-Beschriftung (Sichtbarkeit steuert das Inline-PWA-Skript)
  const ib = document.getElementById('installbtn');
  if (ib) ib.textContent = t('install');
  setzeHinweise(hinweiseAn);   // Beschriftung des ⓘ-Schalters
  // Druck-Empfehlungen in der aktuellen Sprache einspeisen
  document.getElementById('printview').innerHTML = renderPrint(i18n.lang);
}

// Reiter: die beiden Bauteile teilen sich die Generator-Ansicht,
// die Druck-Empfehlungen sind eine eigene Seite.
const REITER = { gen: 'tab-gen', rolle: 'tab-rolle', print: 'tab-print' };
function activateTab(name) {
  const gen = name !== 'print';
  document.getElementById('genview').hidden = !gen;
  document.getElementById('printview').hidden = gen;
  for (const [n, id] of Object.entries(REITER))
    document.getElementById(id).setAttribute('aria-selected', String(n === name));
  // Der ⓘ-Schalter wirkt nur aufs Formular — in den Druck-Empfehlungen
  // stünde er wirkungslos herum.
  document.getElementById('hintsbtn').hidden = !gen;
  if (gen) {
    zeigeBauteil(name === 'rolle' ? 'rolle' : 'ritzel');
    setStaticTexts();          // Beschriftung des STL-Knopfs folgt dem Bauteil
    // Wird die 3D-Ansicht wieder sichtbar, muss der Renderer neu vermessen
    // (der Viewport war ausgeblendet → Größe 0).
    dispatchEvent(new Event('resize'));
  }
}
for (const [n, id] of Object.entries(REITER))
  document.getElementById(id).addEventListener('click', () => activateTab(n));

initI18n();
zeigeBauteil('ritzel');   // baut das Formular und blendet die Rollen-Gruppen aus
setStaticTexts();
initStep();               // Cloud-Build-Button verdrahten (eigene Werte)
refreshStepButton(bauteil);   // STEP-Buttons gleich beim Start setzen (ohne 3D)

document.getElementById('hintsbtn').addEventListener('click', () => {
  setzeHinweise(!hinweiseAn);
  merke(hinweiseAn);
});

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
  buildFormFields(onFormChange, bauteil);
  setStaticTexts();
  refreshStepButton(bauteil);   // Beschriftung in neuer Sprache
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
