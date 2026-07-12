# ritzel_params.py
# Gemeinsame Parameter-Logik fuer build_headless.py und render_gui_preview.py:
# Standardwerte aus zahnrad_params.py + Overrides aus PARAMS_JSON zusammenfuehren.

import os
import json
import sys


def lade_parameter(default_fields):
    """default_fields: DEFAULT_FIELDS aus zahnrad_params.py
    (Liste von (key, label, default))."""
    params = {key: default for key, _label, default in default_fields}
    params['rundungen'] = True  # Standard: mit Verrundungen bauen

    roh = os.environ.get('PARAMS_JSON', '').strip()
    if roh:
        try:
            overrides = json.loads(roh)
        except json.JSONDecodeError as e:
            print(f"PARAMS_JSON ist kein gueltiges JSON: {e}")
            sys.exit(1)
        unbekannt = set(overrides) - set(params)
        if unbekannt:
            print(f"Warnung: unbekannte Parameter werden ignoriert: {sorted(unbekannt)}")
        for k, v in overrides.items():
            if k in params:
                params[k] = v
    return params
