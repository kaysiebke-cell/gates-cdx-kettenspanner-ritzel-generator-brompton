# golden_dump.py
# Rechnet die Python-Seite der Vergleichsrechnung und gibt sie als JSON aus.
# Aufgerufen von tools/golden-test.mjs — nicht zum Einzelgebrauch gedacht.
#
# Bewusst nur mit der Standardbibliothek und OHNE FreeCAD: geprueft werden
# genau die Module, die ihre Formeln mit dem Web-Generator teilen
# (zahnprofil.py, speichen_geometrie.py, zahnrad_params.py).

import json
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO, 'freecad'))

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


def main():
    faelle = json.load(sys.stdin)
    json.dump({
        'zaehne_min': zparams.ZAEHNE_MIN,
        'zaehne_max': zparams.ZAEHNE_MAX,
        'standard': {key: std for key, _label, std in zparams.DEFAULT_FIELDS},
        'faelle': [werte(p) for p in faelle],
    }, sys.stdout)


if __name__ == '__main__':
    main()
