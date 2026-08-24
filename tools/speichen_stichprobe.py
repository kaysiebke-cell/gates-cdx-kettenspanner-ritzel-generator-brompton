# speichen_stichprobe.py
# Rechnet ein festes Raster an Speichen-Konturen durch und gibt es als Tabelle
# aus. Das JS-Gegenstueck in tools/check-speichen.mjs erzeugt dieselbe Tabelle
# aus web/js/speichen.js — Zeile fuer Zeile vergleichbar.

import math
import os
import sys

sys.path.insert(0, os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'freecad'))

import speichen_geometrie as sg          # noqa: E402

# Zahnprofil-Konstanten wie in zahnrad_params.py (Standardwerte)
BASIS = dict(breite=11.0, steg_w=3.0, tiefe=5.6, seiten_t=6.0, tasche_b=5.0,
             mulde_winkel=35.0, nabe_d=20.0, bohrung_d=14.0, speichen_wand=2.0)
SPITZEN_ABSTAND, SPITZEN_R = 10.20, 1.40

ZAEHNE = (12, 14, 16, 17, 18)
RUNDUNG = (0.0, 1.0, 2.0, 3.0, 4.0, 6.0)
NABE_R = (0.0, 2.0, 4.0, 8.0)
SCHWUNG = (0.0, 10.0, 15.0, 30.0)
ANZAHL = (3, 4, 5, 6, 8)
BREITE = (3.0, 4.5, 6.0)


def zeilen():
    for z in ZAEHNE:
        r_kopf = SPITZEN_ABSTAND / (2 * math.sin(math.pi / z)) + SPITZEN_R
        r_innen, r_aussen = sg.ring_radien(r_kopf, BASIS)
        for rd in RUNDUNG:
            for sw in SCHWUNG:
                for n in ANZAHL:
                    for b in BREITE:
                        for rn in NABE_R:
                            e = sg.kontur(n, b, r_innen, r_aussen, rd, sw, rn)
                            yield ' '.join(f"{float(x):.4f}" for x in (
                                z, n, b, rd, sw, rn, r_innen, r_aussen,
                                len(e['oeffnungen']), e['schwung'],
                                e['rundung'], e['rundung_nabe'],
                                sg.flaeche(e['oeffnungen'])))


if __name__ == '__main__':
    print('\n'.join(zeilen()))
