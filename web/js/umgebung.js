// ── Laufzeit-Umgebung ───────────────────────────────────────────────
// Beantwortet die Frage „wo läuft die Anwendung gerade?“ — und zwar
// ausschließlich über Eigenschaften der Darstellungsfläche (kurze
// Bildschirmkante, Zeigerart, Anzeigemodus), NICHT über den User-Agent:
// Kennungen lassen sich abschalten, lügen (jedes Tablet nennt sich mal
// „Macintosh“) und veralten mit jedem neuen Gerät. Interessant ist ohnehin
// nicht das Modell, sondern was daraus folgt — wie viel Platz da ist, ob
// mit Finger oder Maus bedient wird und wie viel Rechenlast die Vorschau
// verträgt.
//
// Die Werte sind LEBEND: Fenster verkleinern, Tablet drehen, Maus an ein
// Tablet stecken, Dunkelmodus umschalten — alles ändert sie im Betrieb.
// Wer darauf reagieren will, abonniert mit beiWechsel().
//
// Zusätzlich landet der Befund als data-Attribute am <html>-Element
// (data-form, data-zeiger, data-huelle, data-lage), damit auch CSS darauf
// zugreifen kann, ohne die Breite noch einmal getrennt abzufragen.

// Ab dieser kurzen Kante (CSS-Pixel) gilt ein Touch-Gerät als Tablet.
// Handys liegen bei 320–500, das kleinste iPad bei 768.
const SCHWELLE_TABLET = 600;

// Renderbudget je Leistungsklasse. Die Kantenglättung steht nur beim Start
// zur Wahl (der WebGL-Kontext wird einmal erzeugt), Pixeldeckel und
// Schattenkarte lassen sich jederzeit nachziehen.
const QUALITAET = {
  hoch:    { kantenglaettung: true,  pixelDeckel: 2,    schattenKarte: 2048 },
  mittel:  { kantenglaettung: false, pixelDeckel: 1.75, schattenKarte: 1536 },
  sparsam: { kantenglaettung: false, pixelDeckel: 1.5,  schattenKarte: 1024 },
};

// matchMedia fehlt in exotischen Umgebungen (alte WebViews, Testrunner) —
// dann liefert passt() eben false und alles läuft in der Desktop-Annahme.
function mq(abfrage) {
  try { return typeof matchMedia === 'function' ? matchMedia(abfrage) : null; }
  catch { return null; }
}
function passt(liste) { return !!(liste && liste.matches); }

const GROB       = mq('(pointer: coarse)');
const HOCHFORMAT = mq('(orientation: portrait)');
const DUNKEL     = mq('(prefers-color-scheme: dark)');
const APP_MODUS  = mq('(display-mode: standalone)');
const VOLLBILD   = mq('(display-mode: fullscreen)');

// Kurze Bildschirmkante statt Fensterbreite: sie beschreibt das Gerät und
// bleibt gleich, wenn das Fenster schmal gezogen oder geteilt wird. Nur
// wenn screen nichts hergibt, muss das Fenster herhalten.
function kurzeKante() {
  const b = typeof screen !== 'undefined' ? screen.width || 0 : 0;
  const h = typeof screen !== 'undefined' ? screen.height || 0 : 0;
  const k = Math.min(b, h);
  if (k > 0) return k;
  const fb = typeof window !== 'undefined'
    ? Math.min(window.innerWidth || 0, window.innerHeight || 0) : 0;
  return fb;
}

// Browser, installierte Web-App oder die Android-APK? Die APK erkennt sich
// an ihrer eigenen Download-Brücke (siehe MainActivity.kt) — in ihr gilt
// display-mode weiterhin als „browser“, obwohl kein Browser zu sehen ist.
function huelle() {
  if (typeof window !== 'undefined' && window.AndroidDownload) return 'android-app';
  if (passt(APP_MODUS) || passt(VOLLBILD)) return 'installiert';
  // iOS meldet den Startbildschirm-Modus bis heute nur hierüber.
  if (typeof navigator !== 'undefined' && navigator.standalone === true) return 'installiert';
  return 'browser';
}

// Schwache Geräte gibt es in jeder Klasse — ein Büro-Thin-Client rendert
// nicht besser als ein Tablet. Kerne und Speicher stufen darum zusätzlich
// herab (deviceMemory kennt nur Chromium, fehlt sonst und zählt dann nicht).
function leistungsklasse(form) {
  const kerne = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 0;
  const speicher = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 0;
  const schwach = (kerne > 0 && kerne <= 2) || (speicher > 0 && speicher <= 2);
  if (form === 'desktop') return schwach ? 'mittel' : 'hoch';
  if (form === 'tablet')  return schwach ? 'sparsam' : 'mittel';
  return 'sparsam';
}

function ermittle() {
  const grob = passt(GROB);
  const kante = kurzeKante();
  // Feiner Zeiger heißt Maus oder Trackpad — also Notebook/PC, ganz gleich
  // wie breit gerade das Fenster ist. Ein Notebook mit Touchscreen meldet
  // ebenfalls „fein“, weil sein PRIMÄRER Zeiger das Trackpad bleibt.
  const form = !grob ? 'desktop' : (kante < SCHWELLE_TABLET ? 'handy' : 'tablet');
  const klasse = leistungsklasse(form);
  return {
    form,                                        // handy | tablet | desktop
    zeiger: grob ? 'finger' : 'maus',
    huelle: huelle(),                            // browser | installiert | android-app
    lage: passt(HOCHFORMAT) ? 'hoch' : 'quer',
    dunkel: passt(DUNKEL),
    kurzeKante: kante,
    pixelDichte: Math.round(((typeof devicePixelRatio === 'number' ? devicePixelRatio : 1) || 1) * 100) / 100,
    leistung: klasse,                            // hoch | mittel | sparsam
    ...QUALITAET[klasse],
  };
}

// shell.bundle.js und viewer.bundle.js sind zwei getrennte Skripte; ohne
// gemeinsamen Anker liefe dieses Modul zweimal, mit doppelten Zuhörern und
// zwei auseinanderlaufenden Zuständen. Darum hängt der Befund am window —
// genauso wie die Sprache in i18n.js.
const ANKER = '__ritzelUmgebung';
const vorhanden = typeof window !== 'undefined' && window[ANKER];

export const umgebung = vorhanden || Object.assign({ _abos: [] }, ermittle());

/**
 * Bei jeder Änderung der Umgebung aufrufen. Gibt eine Funktion zum
 * Abbestellen zurück.
 */
export function beiWechsel(fn) {
  umgebung._abos.push(fn);
  return () => {
    const i = umgebung._abos.indexOf(fn);
    if (i >= 0) umgebung._abos.splice(i, 1);
  };
}

// Befund ans <html>-Element schreiben, damit CSS ihn ohne eigene
// Media-Query mitlesen kann (z. B. Daumenflächen bei Fingerbedienung).
function markiere() {
  const el = typeof document !== 'undefined' && document.documentElement;
  if (!el) return;
  el.dataset.form = umgebung.form;
  el.dataset.zeiger = umgebung.zeiger;
  el.dataset.huelle = umgebung.huelle;
  el.dataset.lage = umgebung.lage;
}

function aktualisiere() {
  const neu = ermittle();
  const geaendert = Object.keys(neu).some(k => umgebung[k] !== neu[k]);
  Object.assign(umgebung, neu);
  markiere();
  if (!geaendert) return;
  // Kopie durchlaufen: ein Abonnent darf sich im Rückruf abmelden.
  for (const fn of umgebung._abos.slice()) {
    try { fn(umgebung); } catch (e) { console.error('Umgebungs-Abonnent:', e); }
  }
  try { dispatchEvent(new CustomEvent('umgebung', { detail: umgebung })); } catch { /* egal */ }
}

function beobachte(liste) {
  if (!liste) return;
  if (liste.addEventListener) liste.addEventListener('change', aktualisiere);
  else if (liste.addListener) liste.addListener(aktualisiere);   // Safari < 14
}

if (!vorhanden && typeof window !== 'undefined') {
  window[ANKER] = umgebung;   // ab jetzt teilen sich beide Bundles diesen Befund
  markiere();
  [GROB, HOCHFORMAT, DUNKEL, APP_MODUS, VOLLBILD].forEach(beobachte);
  // Fenstergröße: fängt den Wechsel auf einen anderen Bildschirm ab (andere
  // Pixeldichte) und das Drehen dort, wo die Orientierungs-Abfrage fehlt.
  // Gebündelt auf einen Frame, resize feuert sonst im Dutzend.
  let wartet = false;
  addEventListener('resize', () => {
    if (wartet) return;
    wartet = true;
    requestAnimationFrame(() => { wartet = false; aktualisiere(); });
  });
  // Die Android-Brücke steht erst, wenn die Seite fertig geladen ist —
  // ein Nachfassen, sonst hielte sich die APK für einen Browser.
  addEventListener('load', aktualisiere);
}
