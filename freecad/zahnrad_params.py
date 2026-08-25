# zahnrad_params.py
# Standardwerte und Felddefinitionen für den Zahnrad-Konfigurator.
#
# Die Werte stehen NICHT hier, sondern in params.json im Projekt-Wurzel-
# verzeichnis — derselben Datei, aus der auch der Web-Konfigurator
# (web/js/fields.js) baut. Dieses Modul reicht sie nur in der Form weiter,
# die zahnrad_ui.py und ritzel_params.py erwarten. Werte bitte ausschließlich
# in params.json ändern.

import json
import os

_HIER = os.path.dirname(os.path.abspath(__file__))
PARAMS_DATEI = os.path.join(os.path.dirname(_HIER), "params.json")

with open(PARAMS_DATEI, encoding="utf-8") as _f:
    _PARAMS = json.load(_f)

# Harte Zähnezahl-Grenzen (dieselben Werte sieht die Web-Version)
ZAEHNE_MIN = _PARAMS["zaehne_min"]
ZAEHNE_MAX = _PARAMS["zaehne_max"]

_NACH_ID = {a["id"]: a for a in _PARAMS["abschnitte"]}

# Eingabefelder, gegliedert wie das FreeCAD-Bedienfeld sie anzeigt.
# Format je Abschnitt: (Überschrift, [ (key, label, default), ... ])
FIELD_SECTIONS = [
    (_NACH_ID[_id]["de"],
     [(f["key"], f["de"], f["standard"]) for f in _NACH_ID[_id]["felder"]])
    for _id in _PARAMS["reihenfolge_freecad"]
]

# Flache Liste aller Felder (für Persistenz & Standardwerte)
DEFAULT_FIELDS = [feld for _, felder in FIELD_SECTIONS for feld in felder]
