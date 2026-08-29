# zahnrad_params.py
# Bauteile, Standardwerte und Felddefinitionen für den Konfigurator.
#
# Die Werte stehen NICHT hier, sondern in params.json im Projekt-Wurzel-
# verzeichnis — derselben Datei, aus der auch der Web-Konfigurator
# (web/js/fields.js) baut. Dieses Modul reicht sie nur in der Form weiter,
# die zahnrad_ui.py und ritzel_params.py erwarten. Werte bitte ausschließlich
# in params.json ändern.
#
# Seit dem zweiten Bauteil (Spannrolle) trägt params.json eine Ebene mehr:
# bauteile -> abschnitte -> felder. Die alten Namen ZAEHNE_MIN/MAX,
# FIELD_SECTIONS und DEFAULT_FIELDS meinen weiterhin das Ritzel, damit
# Bedienfeld, Bügel und headless-Bau unverändert weiterlaufen.

import json
import os

_HIER = os.path.dirname(os.path.abspath(__file__))
PARAMS_DATEI = os.path.join(os.path.dirname(_HIER), "params.json")

with open(PARAMS_DATEI, encoding="utf-8") as _f:
    _PARAMS = json.load(_f)

_BAUTEILE = {b["id"]: b for b in _PARAMS["bauteile"]}
STANDARD_BAUTEIL = _PARAMS["bauteile"][0]["id"]

# (id, Name) je Bauteil — für einen künftigen Umschalter im Bedienfeld.
BAUTEILE = [(b["id"], b["de"]) for b in _PARAMS["bauteile"]]


def _teil(bauteil):
    return _BAUTEILE.get(bauteil, _BAUTEILE[STANDARD_BAUTEIL])


def feld_sektionen(bauteil=STANDARD_BAUTEIL):
    """Eingabefelder eines Bauteils, gegliedert wie das FreeCAD-Bedienfeld
    sie anzeigt. Format je Abschnitt: (Überschrift, [(key, label, default)])."""
    teil = _teil(bauteil)
    nach_id = {a["id"]: a for a in teil["abschnitte"]}
    reihenfolge = teil.get("reihenfolge_freecad", list(nach_id))
    return [
        (nach_id[_id]["de"],
         [(f["key"], f["de"], f["standard"]) for f in nach_id[_id]["felder"]])
        for _id in reihenfolge
    ]


def default_fields(bauteil=STANDARD_BAUTEIL):
    """Flache Liste aller Felder eines Bauteils (Persistenz & Standardwerte)."""
    return [feld for _, felder in feld_sektionen(bauteil) for feld in felder]


def zaehne_grenzen(bauteil=STANDARD_BAUTEIL):
    """(min, max) — oder None für Bauteile ohne Zähne."""
    teil = _teil(bauteil)
    if "zaehne_min" not in teil:
        return None
    return teil["zaehne_min"], teil["zaehne_max"]


# ── Bisherige Namen: sie meinen das Ritzel ─────────────────────────────────
ZAEHNE_MIN, ZAEHNE_MAX = zaehne_grenzen("ritzel")
FIELD_SECTIONS = feld_sektionen("ritzel")
DEFAULT_FIELDS = default_fields("ritzel")
