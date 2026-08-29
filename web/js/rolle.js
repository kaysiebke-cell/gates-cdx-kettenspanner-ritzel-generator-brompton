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
  // Reicht der Kranz bis an die Nabe oder darüber hinaus, ist die Rolle
  // einfach voll — das ist ein gültiger Körper, nur eben ohne Speichen.
  // Unbaubar wird es erst, wenn außen nichts mehr über der Nabe steht.
  if (r.rAussen <= r.rNabe) m.push('kranz_fehlt');
  if (r.rNabe - r.rBohrung < MIN_NABE) m.push('nabe_duenn');
  if (r.rLager > 0 && r.rLager <= r.rBohrung) m.push('lagersitz_zu_klein');
  if (r.rLager >= r.rNabe) m.push('lagersitz_ueber_nabe');
  if (p.lager_t * 2 >= p.rolle_b) m.push('lagersitz_zu_tief');
  return m;
}

// Verrundung der beiden umlaufenden Laufflächenkanten. Sie darf weder halbe Kranzdicke
// noch halbe Breite überschreiten, sonst frisst sie die Lauffläche auf.
export function kantenRadius(p) {
  return Math.max(0, Math.min(p.kante_r, p.rolle_wand / 2, p.rolle_b / 2));
}

// ── Drehprofil ─────────────────────────────────────────────────────────────
// Der Querschnitt der Rolle, einmal umlaufend in (r, z): radial nach außen,
// axial über die Breite. Um die Achse gedreht ergibt er den ganzen Körper —
// Lauffläche, Kantenrundungen, Bohrung und die beiden Flanschsenkungen.
//
// Segmente wie in speichen.js: echte Linien und Kreisbögen, kein Polygonzug.
// Die Vorschau zerlegt die Bögen in Punkte, FreeCAD baut daraus echte Arcs —
// deshalb liegt hier auch `pm`, ein Punkt auf dem Bogen (Part.Arc mag drei
// Punkte lieber als Winkel und Normalen).
//
// Die Umlaufrichtung ist bewusst DIESE: andersherum zeigt die Hülle nach
// innen (negatives Volumen) und das STL wäre umgestülpt.
const linie = (p0, p1) => ({ typ: 'linie', p0, p1 });

function viertelbogen(c, radius, a0, a1) {
  const auf = (a) => [c[0] + radius * Math.cos(a), c[1] + radius * Math.sin(a)];
  return { typ: 'bogen', c, r: radius, a0, a1,
           p0: auf(a0), pm: auf((a0 + a1) / 2), p1: auf(a1) };
}

export function profil(p) {
  const r = radien(p);
  const k = kantenRadius(p);
  const L = p.rolle_b / 2;
  const rB = Math.max(r.rBohrung, 0.1);
  const rS = Math.max(r.rLager, rB);
  const t = Math.min(p.lager_t, L / 2);
  const rA = r.rAussen;
  const H = Math.PI / 2;

  const seg = [
    linie([rS, L - t], [rB, L - t]),      // Senkungsgrund oben
    linie([rB, L - t], [rB, -L + t]),     // Bohrungswand
    linie([rB, -L + t], [rS, -L + t]),    // Senkungsgrund unten
    linie([rS, -L + t], [rS, -L]),        // Senkungswand unten
  ];
  if (k > 0.01) {
    seg.push(linie([rS, -L], [rA - k, -L]));                 // Stirnfläche unten
    seg.push(viertelbogen([rA - k, -L + k], k, -H, 0));      // Kante unten
    seg.push(linie([rA, -L + k], [rA, L - k]));              // Lauffläche
    seg.push(viertelbogen([rA - k, L - k], k, 0, H));        // Kante oben
    seg.push(linie([rA - k, L], [rS, L]));                   // Stirnfläche oben
  } else {
    seg.push(linie([rS, -L], [rA, -L]));
    seg.push(linie([rA, -L], [rA, L]));
    seg.push(linie([rA, L], [rS, L]));
  }
  seg.push(linie([rS, L], [rS, L - t]));   // Senkungswand oben, schließt den Umlauf
  return seg;
}

// Volumen des vollen Rings ohne Speichen [mm³] — Kranz plus Nabe plus Steg,
// abzüglich Bohrung und der beiden Flanschsenkungen. Die Kantenrundung ist
// darin NICHT abgezogen — bei R 0,8 sind das rund 0,07 cm³ oder ein halbes
// Prozent (am gerenderten Körper nachgemessen).
export function vollVolumen(p) {
  const r = radien(p);
  const kreis = (rad) => Math.PI * rad * rad;
  let v = (kreis(r.rAussen) - kreis(r.rBohrung)) * p.rolle_b;
  if (r.rLager > r.rBohrung)
    v -= (kreis(r.rLager) - kreis(r.rBohrung)) * p.lager_t * 2;
  return v;
}
