macros/main.py
# Startet den Zahnrad-Konfigurator in FreeCAD.
#
# Wrapper, der das Makro in das macros/ Verzeichnis verschiebt. Beibehaltung
# des ursprünglichen Verhaltens: das Makro legt sein eigenes Verzeichnis
# an den Python-Pfad vorne, damit Konflikte mit dem Makro-Editor vermieden
# werden.

import os
import sys

# Verzeichnis dieses Makros ermitteln
try:
    MACRO_DIR = os.path.dirname(os.path.abspath(__file__))
except NameError:
    MACRO_DIR = os.path.dirname(__file__)

if MACRO_DIR in sys.path:
    sys.path.remove(MACRO_DIR)
sys.path.insert(0, MACRO_DIR)

for _m in ("zahnrad_params", "zahnrad_generator", "zahnrad_ui"):
    sys.modules.pop(_m, None)

import FreeCADGui as Gui
from zahnrad_ui import ZahnradDockPanel

if Gui.Control.activeDialog():
    Gui.Control.closeDialog()

panel = ZahnradDockPanel()
panel.show()
