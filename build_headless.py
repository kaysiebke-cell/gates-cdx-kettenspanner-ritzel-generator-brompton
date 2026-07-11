# build_headless.py
# Baut das Gates-CDX-Ritzel headless (ohne FreeCAD-GUI) und exportiert
# STEP + STL. Nutzt ausschliesslich die bestehende Baulogik aus
# zahnrad_generator.py / zahnrad_params.py -- keine Aenderung am Original.
#
# Aufruf:  freecadcmd build_headless.py
# Parameter kommen ueber die Umgebungsvariable PARAMS_JSON (JSON-Objekt,
# ueberschreibt nur die angegebenen Felder; Rest = Standardwerte).

import os
import sys

REPO_DIR = os.environ.get('REPO_DIR', os.path.dirname(os.path.abspath(__file__)))
if REPO_DIR not in sys.path:
    sys.path.insert(0, REPO_DIR)

import FreeCAD as App
import Part

from zahnrad_generator import ZahnradVollGenerator
from zahnrad_params import DEFAULT_FIELDS
from ritzel_params import lade_parameter


def main():
    params = lade_parameter(DEFAULT_FIELDS)
    print("Baue Ritzel mit Parametern:")
    import json
    print(json.dumps(params, indent=2, ensure_ascii=False))

    App.newDocument("ZahnradDokument")

    generator = ZahnradVollGenerator()
    teil = generator.make_fertigteil(params)

    if teil is None or not teil.Shape.isValid() or teil.Shape.Volume <= 0:
        print("Fehler: Es konnte kein gueltiger Koerper erzeugt werden.")
        sys.exit(1)

    out_dir = os.environ.get('OUTPUT_DIR', 'output')
    os.makedirs(out_dir, exist_ok=True)

    z = int(params['zaehne'])
    basisname = f"ritzel_z{z}"
    step_pfad = os.path.join(out_dir, f"{basisname}.step")
    stl_pfad = os.path.join(out_dir, f"{basisname}.stl")

    Part.export([teil], step_pfad)

    # STL über MeshPart mit definierter Auflösung exportieren —
    # exportStl() tesselliert extrem fein und erzeugt >300-MB-Dateien.
    # 0,05 mm Abweichung ist für ein ~47-mm-Druckteil mehr als genau.
    import MeshPart
    mesh = MeshPart.meshFromShape(
        Shape=teil.Shape,
        LinearDeflection=0.05,
        AngularDeflection=0.5,
        Relative=False,
    )
    mesh.write(stl_pfad)

    print(f"Fertig: {step_pfad}")
    print(f"Fertig: {stl_pfad}")


# freecadcmd setzt __name__ auf den Modulnamen (nicht "__main__"),
# daher main() direkt aufrufen — sonst passiert still gar nichts.
main()
