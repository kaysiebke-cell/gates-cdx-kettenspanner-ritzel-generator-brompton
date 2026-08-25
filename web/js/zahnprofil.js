// zahnprofil.js
// Kontur-Mathematik des Zahnprofils — Port von freecad/zahnprofil.py,
// Formel für Formel identisch. Änderungen bitte IMMER in beiden Dateien;
// `npm test` rechnet beide Fassungen durch und meldet jede Abweichung.
//
// Bewusst OHNE Three.js-Import: so ist die Datei in Node direkt prüfbar,
// und geometry.js macht daraus die THREE-Objekte für die Vorschau.
// Punkte sind [x, y].

const dir = t => [Math.cos(t), Math.sin(t)];
const auf = (c, r, t) => [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)];

// Punkte je Bogen (Kopfrundung bzw. Fußrundung). Das CAD-Modell zeichnet
// echte Kreisbögen; für die Vorschau wird hier in N Schritte zerlegt.
export const BOGEN_N = 16;

// Die radialen Kennmaße des Profils.
//   rBahn     Bahnkreis der Kopfrundungs-Mittelpunkte
//   rKopf     Außenradius (Zahnspitze)
//   rFussMin  kleinster Radius der Zahnlücke
//   rFussBahn Bahnkreis der Fußrundungs-Mittelpunkte
export function radien(p) {
  const rS = p.spitzen_d / 2, rF = p.fuss_d / 2;
  const rBahn = p.spitzen_abstand / (2 * Math.sin(Math.PI / p.zaehne));
  const rKopf = rBahn + rS;
  const rFussMin = rKopf - p.tiefe;
  return { rBahn, rKopf, rFussMin, rFussBahn: rFussMin + rF };
}

// Geschlossener Umriss eines Zahnrads, gegen den Uhrzeigersinn.
// Je Zahn: Kopfrundung außen (vorwärts), dann Fußrundung innen (rückwärts) —
// die Flanken ergeben sich als Verbindung zwischen den Bögen.
export function konturPunkte(p, n = BOGEN_N) {
  const z = p.zaehne;
  const off = (p.eingriffswinkel * Math.PI / 180) * 0.5;
  const rS = p.spitzen_d / 2, rF = p.fuss_d / 2;
  const { rBahn, rFussBahn } = radien(p);
  const spanne = Math.PI - 2 * off;
  const pts = [];
  for (let i = 0; i < z; i++) {
    const wZ = 2 * Math.PI * i / z, wF = 2 * Math.PI * (i + 0.5) / z;
    const cpS = dir(wZ).map(v => v * rBahn);
    const cpF = dir(wF).map(v => v * rFussBahn);
    for (let k = 0; k <= n; k++)          // Zahnkopf-Bogen (außen)
      pts.push(auf(cpS, rS, wZ - Math.PI / 2 + off + spanne * k / n));
    for (let k = 0; k <= n; k++)          // Fußrundung (innen, rückwärts)
      pts.push(auf(cpF, rF, wF + 1.5 * Math.PI - off - spanne * k / n));
  }
  return pts;
}
