// rolle.js
// Kontur-Mathematik der glatten Spannrolle — Port von
// freecad/rolle_geometrie.py, Formel für Formel identisch. Änderungen bitte
// IMMER in beiden Dateien; `npm test` rechnet beide Fassungen durch und
// meldet jede Abweichung.
//
// Die Rolle läuft mit glatter Lauffläche auf dem RÜCKEN des CDX-Riemens und
// drückt ihn gegen das Ritzel. Aufbau wie ein kleines Rad: außen der
// Laufkranz, innen die Nabe mit den beiden Flanschsitzen, dazwischen
// Speichen. Die Durchbrüche rechnet speichen.js — dasselbe Modul wie beim
// Ritzel, es bekommt hier nur andere Radien.
//
// Bewusst OHNE Three.js-Import: so ist die Datei in Node direkt prüfbar.

// Kleinste sinnvolle Wandstärken [mm]. Darunter wird nicht gebaut, sondern
// der jeweilige Anteil weggelassen — wie beim Ritzel, wo ein zu schmaler
// Ring die Speichen entfallen lässt.
export const MIN_KRANZ = 1.0;    // Lauffläche nach innen
export const MIN_NABE  = 1.0;    // Material zwischen Bohrung und Nabenaußen

// ── Die radialen Kennmaße ──────────────────────────────────────────────────
//   rAussen      Lauffläche (Außenmaß der ganzen Rolle)
//   rKranzInnen  Innenkante des Laufkranzes — hier enden die Speichen außen
//   rNabe        Nabenaußenrand — hier setzen die Speichen innen an
//   rBohrung     zentrale Wellenbohrung
//   rLager       Flanschsenkung an beiden Stirnseiten
export function radien(p) {
  const rAussen = p.rolle_d / 2;
  const rKranzInnen = rAussen - p.rolle_wand;
  const rNabe = p.nabe_d / 2;
  const rBohrung = p.bohrung_d / 2;
  const rLager = p.lager_d / 2;
  return { rAussen, rKranzInnen, rNabe, rBohrung, rLager };
}

// Radien, mit denen speichen.js rechnet: außen die Kranzinnenkante, innen
// der Nabenrand. Anders als beim Ritzel gibt es keinen Wand-Aufschlag —
// Kranzdicke und Nabe sind hier eigene Felder und stehen schon exakt da.
export function ringRadien(p) {
  const { rKranzInnen, rNabe } = radien(p);
  return { ri: rNabe, ra: rKranzInnen };
}

// Baut die Rolle überhaupt? Liefert die Liste der Gründe, warum nicht —
// leer heißt: alles in Ordnung. Die Reihenfolge ist die der Prüfung.
export function maengel(p) {
  const r = radien(p);
  const m = [];
  if (!(p.rolle_d > 0)) m.push('aussen_d');
  if (!(p.rolle_b > 0)) m.push('breite');
  if (p.rolle_wand < MIN_KRANZ) m.push('kranz_duenn');
  if (r.rKranzInnen <= r.rNabe) m.push('kranz_ueber_nabe');
  if (r.rNabe - r.rBohrung < MIN_NABE) m.push('nabe_duenn');
  if (r.rLager > 0 && r.rLager <= r.rBohrung) m.push('lagersitz_zu_klein');
  if (r.rLager >= r.rNabe) m.push('lagersitz_ueber_nabe');
  if (p.lager_t * 2 >= p.rolle_b) m.push('lagersitz_zu_tief');
  return m;
}

// Verrundung der vier Laufflächenkanten. Sie darf weder halbe Kranzdicke
// noch halbe Breite überschreiten, sonst frisst sie die Lauffläche auf.
export function kantenRadius(p) {
  return Math.max(0, Math.min(p.kante_r, p.rolle_wand / 2, p.rolle_b / 2));
}

// Volumen des vollen Rings ohne Speichen [mm³] — Kranz plus Nabe plus Steg,
// abzüglich Bohrung und der beiden Flanschsenkungen. Die Kantenrundung ist
// darin nicht abgezogen; sie ändert unter einem Promille.
export function vollVolumen(p) {
  const r = radien(p);
  const kreis = (rad) => Math.PI * rad * rad;
  let v = (kreis(r.rAussen) - kreis(r.rBohrung)) * p.rolle_b;
  if (r.rLager > r.rBohrung)
    v -= (kreis(r.rLager) - kreis(r.rBohrung)) * p.lager_t * 2;
  return v;
}
