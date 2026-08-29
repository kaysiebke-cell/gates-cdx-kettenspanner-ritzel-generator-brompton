# golden_dump.py
# Rechnet die Python-Seite der Vergleichsrechnung und gibt sie als JSON aus.
# Aufgerufen von tools/golden-test.mjs — nicht zum Einzelgebrauch gedacht.
#
# Bewusst nur mit der Standardbibliothek und OHNE FreeCAD: geprueft werden
# genau die Module, die ihre Formeln mit dem Web-Generator teilen
# (zahnprofil.py, speichen_geometrie.py, rolle_geometrie.py,
# zahnrad_params.py).

import json
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO, 'freecad'))

import rolle_geometrie as ro             # noqa: E402
import speichen_geometrie as sp          # noqa: E402
import zahnprofil as zp                  # noqa: E402
import zahnrad_params as zparams         # noqa: E402


def _listen(o):
    """Tupel -> Listen, damit der JSON-Vergleich nicht an der Form scheitert."""
    if isinstance(o, dict):
        return {k: _listen(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [_listen(x) for x in o]
    return o


def werte(p):
    r = zp.radien(p)
    r_innen, r_aussen = sp.ring_radien(r['r_kopf_max'], p)
    speichen = sp.kontur(p['speichen_n'], p['speichen_b'], r_innen, r_aussen,
                         p['speichen_r'], p['speichen_schwung'])
    return {
        'radien': [r['r_bahn'], r['r_kopf_max'], r['r_fuss_min'], r['r_fuss_bahn']],
        'kontur': _listen(zp.kontur_punkte(p)),
        'ring': [r_innen, r_aussen],
        'sinnvoll': sp.ist_sinnvoll(r_innen, r_aussen, p['speichen_n'], p['speichen_b']),
        'speichen': _listen(speichen),
        'flaeche': sp.flaeche(speichen['oeffnungen']),
    }


def rollen_werte(p):
    """Die Spannrolle: Kennmasse, Speichen-Ring und die Durchbrueche, die
    dasselbe Speichen-Modul liefert wie beim Ritzel — nur mit den Radien der
    Rolle."""
    r = ro.radien(p)
    r_innen, r_aussen = ro.ring_radien(p)
    speichen = sp.kontur(p['speichen_n'], p['speichen_b'], r_innen, r_aussen,
                         p['speichen_r'], 0.0)
    return {
        'radien': [r['r_aussen'], r['r_kranz_innen'], r['r_nabe'],
                   r['r_bohrung'], r['r_lager']],
        'ring': [r_innen, r_aussen],
        'sinnvoll': sp.ist_sinnvoll(r_innen, r_aussen, p['speichen_n'], p['speichen_b']),
        'speichen': _listen(speichen),
        'flaeche': sp.flaeche(speichen['oeffnungen']),
        'profil': _listen(ro.profil(p)),
        'maengel': ro.maengel(p),
        'kante': ro.kanten_radius(p),
        'voll_volumen': ro.voll_volumen(p),
    }


def main():
    eingabe = json.load(sys.stdin)
    json.dump({
        'zaehne_min': zparams.ZAEHNE_MIN,
        'zaehne_max': zparams.ZAEHNE_MAX,
        'standard': {key: std for key, _label, std in zparams.DEFAULT_FIELDS},
        'standard_rolle': {key: std for key, _label, std
                           in zparams.default_fields('rolle')},
        'faelle': [werte(p) for p in eingabe['ritzel']],
        'rollen_faelle': [rollen_werte(p) for p in eingabe['rolle']],
    }, sys.stdout)


if __name__ == '__main__':
    main()
