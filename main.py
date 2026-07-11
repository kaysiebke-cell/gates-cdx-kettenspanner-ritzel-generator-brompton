# main.py
# Startet den Zahnrad-Konfigurator in FreeCAD.
#
# Robust gegen Modulnamen-Konflikte: Der MakroEditor legt eigene Pakete
# (u.a. ein "ui") auf den sys.path. Deshalb heißen unsere Module eindeutig
# "zahnrad_*" und werden hier gezielt aus DIESEM Verzeichnis geladen.

import os
import sys

# Verzeichnis dieses Makros ermitteln (Fallback, falls __file__ beim exec fehlt)
try:
    MACRO_DIR = os.path.dirname(os.path.abspath(__file__))
except NameError:
    MACRO_DIR = "/home/kaysiebke/Desktop/Macros/Gates CDX Ritzel Generator"

# Eigenes Verzeichnis ganz vorne auf den Pfad
if MACRO_DIR in sys.path:
    sys.path.remove(MACRO_DIR)
sys.path.insert(0, MACRO_DIR)

# Evtl. gecachte (alte) Versionen verwerfen, damit Änderungen sofort greifen
for _m in ("zahnrad_params", "zahnrad_generator", "zahnrad_ui"):
    sys.modules.pop(_m, None)

import FreeCADGui as Gui
from zahnrad_ui import ZahnradDockPanel

# Offene Dialoge schließen, um Konflikte zu vermeiden
if Gui.Control.activeDialog():
    Gui.Control.closeDialog()

panel = ZahnradDockPanel()
panel.show()
