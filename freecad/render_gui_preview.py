# render_gui_preview.py
# Erzeugt eine "echte" FreeCAD-Vorschau (Shading + Kantenlinien wie im
# normalen 3D-View), OHNE ein sichtbares Fenster zu benoetigen.
# Muss unter Xvfb laufen (virtueller Bildschirm), da FreeCADGui trotz
# "unsichtbarem" Fenster einen Anzeige-Kontext fuer Coin3D/OpenGL braucht.
#
# Aufruf:  xvfb-run -a freecadcmd render_gui_preview.py
# Parameter wie bei build_headless.py ueber PARAMS_JSON.

import os
import sys

REPO_DIR = os.environ.get('REPO_DIR', os.path.dirname(os.path.abspath(__file__)))
if REPO_DIR not in sys.path:
    sys.path.insert(0, REPO_DIR)

import FreeCAD as App
import FreeCADGui as Gui

from zahnrad_generator import ZahnradVollGenerator
from zahnrad_params import DEFAULT_FIELDS
from ritzel_params import lade_parameter


def main():
    params = lade_parameter(DEFAULT_FIELDS)

    # Laeuft unter dem GUI-Binary (freecad script.py): Hauptfenster ist
    # dann schon da; unter freecadcmd muesste es erst erzeugt werden.
    if Gui.getMainWindow() is None:
        Gui.showMainWindow()
    Gui.getMainWindow().hide()

    doc = App.newDocument("ZahnradDokument")

    # Beim Start als Skript-Argument laeuft die Qt-Event-Loop noch nicht:
    # Events pumpen, bis das GUI-Dokument samt 3D-View existiert.
    import time
    from PySide6 import QtWidgets
    for _ in range(100):
        QtWidgets.QApplication.processEvents()
        if Gui.ActiveDocument is not None and Gui.ActiveDocument.ActiveView is not None:
            break
        time.sleep(0.1)
    else:
        print("Fehler: GUI-Dokument/3D-View wurde nicht initialisiert.")
        os._exit(1)

    generator = ZahnradVollGenerator()
    teil = generator.make_fertigteil(params)

    if teil is None or not teil.Shape.isValid() or teil.Shape.Volume <= 0:
        print("Fehler: Es konnte kein gueltiger Koerper erzeugt werden.")
        sys.exit(1)

    # Optik angleichen an den normalen FreeCAD-Viewport-Look
    vo = teil.ViewObject
    vo.ShapeColor = (0.68, 0.71, 0.76)
    vo.LineColor = (0.10, 0.10, 0.10)
    vo.DisplayMode = "Shaded"

    doc.recompute()

    gdoc = Gui.getDocument(doc.Name)
    view = gdoc.activeView()
    view.setAnimationEnabled(False)
    view.viewIsometric()
    view.fitAll()

    out_dir = os.environ.get('OUTPUT_DIR', 'output')
    os.makedirs(out_dir, exist_ok=True)
    z = int(params['zaehne'])
    png_pfad = os.path.join(out_dir, f"ritzel_z{z}_render.png")

    # 'White' = weisser Hintergrund; alternativ 'Transparent' fuer PNG mit Alpha
    view.saveImage(png_pfad, 1600, 1200, 'White')
    print(f"Render gespeichert: {png_pfad}")

    App.closeDocument(doc.Name)

    # Unter dem GUI-Binary laeuft nach dem Skript die Event-Loop weiter —
    # fuer den CI-Einsatz den Prozess hier hart und sauber beenden.
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(0)


# freecadcmd setzt __name__ auf den Modulnamen (nicht "__main__"),
# daher main() direkt aufrufen — sonst passiert still gar nichts.
main()
