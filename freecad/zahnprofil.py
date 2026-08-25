# zahnprofil.py
# Kontur-Mathematik des Zahnprofils. Bewusst OHNE FreeCAD-Import: dieselben
# Formeln liegen 1:1 in web/js/zahnprofil.js, damit Live-Vorschau und
# CAD-Koerper identisch schneiden. `npm test` rechnet beide Fassungen durch
# und meldet jede Abweichung.
#
# zahn_kanten() liefert exakte Kreisboegen und Eckpunkte — daraus baut
# zahnrad_generator.py ein sauberes Sketch mit wenigen Kanten.
# kontur_punkte() zerlegt dieselben Boegen in einen Polygonzug; das ist die
# Form, in der die Web-Vorschau rechnet, und damit die Vergleichsgrundlage.

import math

# Punkte je Bogen (Kopfrundung bzw. Fussrundung) im Polygonzug.
BOGEN_N = 16

_HALB_PI = math.pi / 2


def _dir(t):
    return (math.cos(t), math.sin(t))


def _auf(c, r, t):
    """Punkt auf dem Kreis um `c` mit Radius `r` beim Winkel `t`."""
    return (c[0] + r * math.cos(t), c[1] + r * math.sin(t))


def radien(p):
    """Die radialen Kennmasse des Profils.

    r_bahn      Bahnkreis der Kopfrundungs-Mittelpunkte
    r_kopf_max  Aussenradius (Zahnspitze)
    r_fuss_min  kleinster Radius der Zahnluecke
    r_fuss_bahn Bahnkreis der Fussrundungs-Mittelpunkte
    """
    r_s = p['spitzen_d'] / 2.0
    r_f = p['fuss_d'] / 2.0
    r_bahn = p['spitzen_abstand'] / (2 * math.sin(math.pi / p['zaehne']))
    r_kopf_max = r_bahn + r_s
    r_fuss_min = r_kopf_max - p['tiefe']
    return {
        'r_bahn': r_bahn,
        'r_kopf_max': r_kopf_max,
        'r_fuss_min': r_fuss_min,
        'r_fuss_bahn': r_fuss_min + r_f,
    }


def zahn_kanten(i, z, alpha, r_bahn, r_fuss_bahn, r_s, r_f, rot=0.0):
    """Kanten des i-ten Zahns: Kopfbogen, Flanke, Fussbogen, Flanke.

    Winkel im Bogenmass. `alpha` ist der Eingriffswinkel, `rot` dreht das
    ganze Rad. Zurueck kommen Mittelpunkte, Bogen-Start-/Endwinkel (gegen den
    Uhrzeigersinn) und die vier Punkte, an denen die Flanken ansetzen.
    """
    off = alpha * 0.5
    w_zahn = 2 * math.pi * i / z + rot
    w_fuss = 2 * math.pi * (i + 0.5) / z + rot
    w_next = 2 * math.pi * (i + 1) / z + rot

    cp_s = _auf((0.0, 0.0), r_bahn, w_zahn)
    cp_s_next = _auf((0.0, 0.0), r_bahn, w_next)
    cp_f = _auf((0.0, 0.0), r_fuss_bahn, w_fuss)

    return {
        'cp_s': cp_s,
        'cp_f': cp_f,
        # Zahnkopf-Bogen (aussen)
        'kopf_a0': w_zahn - _HALB_PI + off,
        'kopf_a1': w_zahn + _HALB_PI - off,
        # Fussrundungs-Bogen (innen)
        'fuss_a0': w_fuss + _HALB_PI + off,
        'fuss_a1': w_fuss + _HALB_PI + math.pi - off,
        # Flanke rechts: Zahnkopf-Ende -> Fussrundungs-Anfang
        'p_zahn_r': _auf(cp_s, r_s, w_zahn + _HALB_PI - off),
        'p_fuss_l': _auf(cp_f, r_f, w_fuss - _HALB_PI - off),
        # Flanke links: Fussrundungs-Ende -> naechster Zahnkopf
        'p_fuss_r': _auf(cp_f, r_f, w_fuss + _HALB_PI + off),
        'p_zahn_next_l': _auf(cp_s_next, r_s, w_next - _HALB_PI + off),
    }


def kontur_punkte(p, n=BOGEN_N):
    """Geschlossener Umriss des Zahnrads, gegen den Uhrzeigersinn.

    Je Zahn: Kopfrundung aussen (vorwaerts), dann Fussrundung innen
    (rueckwaerts) — die Flanken ergeben sich als Verbindung der Boegen.
    """
    z = p['zaehne']
    off = math.radians(p['eingriffswinkel']) * 0.5
    r_s = p['spitzen_d'] / 2.0
    r_f = p['fuss_d'] / 2.0
    r = radien(p)
    spanne = math.pi - 2 * off

    pts = []
    for i in range(z):
        w_zahn = 2 * math.pi * i / z
        w_fuss = 2 * math.pi * (i + 0.5) / z
        cp_s = _auf((0.0, 0.0), r['r_bahn'], w_zahn)
        cp_f = _auf((0.0, 0.0), r['r_fuss_bahn'], w_fuss)
        for k in range(n + 1):          # Zahnkopf-Bogen (aussen)
            pts.append(_auf(cp_s, r_s, w_zahn - _HALB_PI + off + spanne * k / n))
        for k in range(n + 1):          # Fussrundung (innen, rueckwaerts)
            pts.append(_auf(cp_f, r_f, w_fuss + 1.5 * math.pi - off - spanne * k / n))
    return pts
