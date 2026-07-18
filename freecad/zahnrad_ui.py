# zahnrad_ui.py
# FreeCAD Dock-Panel für den Zahnrad-Konfigurator

import os
import json

from PySide6 import QtCore, QtWidgets
import FreeCADGui as Gui

from zahnrad_generator import ZahnradVollGenerator
from zahnrad_params import DEFAULT_FIELDS, FIELD_SECTIONS

# Datei, in der die zuletzt benutzten Feldwerte gespeichert werden
try:
    _WERTE_DATEI = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                "zahnrad_werte.json")
except NameError:   # __file__ fehlt (z.B. via exec) -> fester Pfad
    _WERTE_DATEI = "/home/kaysiebke/Desktop/Macros/Gates CDX Ritzel Generator/zahnrad_werte.json"


class ZahnradDockPanel(QtWidgets.QDockWidget):

    def __init__(self):
        mw = Gui.getMainWindow()
        super().__init__("Zahnrad Setup", mw)

        # Altes Panel entfernen, falls vorhanden
        old = mw.findChild(QtWidgets.QDockWidget, "ZahnradDock")
        if old:
            mw.removeDockWidget(old)

        self.setObjectName("ZahnradDock")
        self.setAllowedAreas(QtCore.Qt.AllDockWidgetAreas)

        self.content = QtWidgets.QWidget()
        self.setWidget(self.content)

        self._busy = False          # verhindert überlappende Bau-Vorgänge
        self._saved = self._load_values()   # zuletzt benutzte Werte (falls vorhanden)

        self._build_layout()

        self.generator = ZahnradVollGenerator()
        mw.addDockWidget(QtCore.Qt.RightDockWidgetArea, self)

    # ------------------------------------------------------------------
    # Layout-Aufbau
    # ------------------------------------------------------------------

    def _build_layout(self):
        # Kein eigenes Styling: Farben, Schrift und Hell-/Dunkelmodus
        # kommen vollständig vom FreeCAD-Theme.
        outer = QtWidgets.QVBoxLayout(self.content)

        # Scrollbereich für die Abschnitte (falls das Panel zu klein wird)
        scroll = QtWidgets.QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QtWidgets.QFrame.NoFrame)
        inner = QtWidgets.QWidget()
        form = QtWidgets.QVBoxLayout(inner)

        # Je Abschnitt: fette Überschrift (Theme-Schrift) + QFrame mit
        # nativem Theme-Rahmen (Box, 1px) — dünner grauer Rahmen ohne
        # Füllung, ganz ohne Stylesheet (FreeCADs QSS funkt so nicht rein).
        self.inputs = {}
        for abschnitt, felder in FIELD_SECTIONS:
            titel = QtWidgets.QLabel(abschnitt)
            font = titel.font()
            font.setBold(True)
            titel.setFont(font)
            form.addWidget(titel)

            kasten = QtWidgets.QFrame()
            kasten.setObjectName("abschnittRahmen")
            # Rahmen per Stylesheet: FreeCADs globales QSS schaltet den
            # nativen QFrame-Rahmen ab. palette(mid) folgt hell/dunkel;
            # der #-Selektor trifft nur den Kasten, nicht die Felder darin.
            kasten.setStyleSheet(
                "QFrame#abschnittRahmen {"
                "  border: 1px solid palette(mid);"
                "  border-radius: 3px;"
                "  background: transparent;"
                "}"
            )
            grid = QtWidgets.QGridLayout(kasten)
            self._build_section_grid(grid, felder)
            form.addWidget(kasten)

        form.addStretch()
        scroll.setWidget(inner)
        outer.addWidget(scroll, 1)

        # Rundungen sind der teuerste Teil des Baus (>80 % der Zeit) —
        # abgewählt entsteht ein schneller Entwurfskörper ohne Verrundungen.
        self.chk_rundungen = QtWidgets.QCheckBox("Rundungen anwenden (langsamer)")
        self.chk_rundungen.setChecked(bool(self._saved.get('rundungen', True)))
        outer.addWidget(self.chk_rundungen)

        # Buttons (bleiben unten fest sichtbar). 2x2-Raster statt einer Reihe:
        # vier Knöpfe nebeneinander erzwingen sonst eine große Mindestbreite,
        # und das Dock lässt sich nicht mehr schmaler ziehen.
        btn_layout = QtWidgets.QGridLayout()
        btn_layout.addWidget(self._make_button("Vorschau", self.run_update), 0, 0)
        btn_layout.addWidget(self._make_button("Körper erzeugen", self.build_body), 0, 1)
        btn_layout.addWidget(self._make_button("Fertigteil", self.build_fertigteil), 1, 0)
        btn_layout.addWidget(self._make_button("Riemenschutz-Bügel", self.build_buegel), 1, 1)
        btn_layout.addWidget(self._make_button("Schließen", self.close), 2, 0, 1, 2)
        outer.addLayout(btn_layout)

    def _build_section_grid(self, grid, felder):
        """Erstellt die Eingabefelder eines Abschnitts (2 Spalten)."""
        for i, (key, label, default) in enumerate(felder):
            box = QtWidgets.QVBoxLayout()
            box.addWidget(QtWidgets.QLabel(label))

            if isinstance(default, int):
                spinbox = QtWidgets.QSpinBox()
            else:
                spinbox = QtWidgets.QDoubleSpinBox()
                spinbox.setDecimals(2)

            spinbox.setRange(-1000, 1000)
            # gespeicherten Wert verwenden, sonst Standard
            wert = self._saved.get(key, default)
            spinbox.setValue(int(wert) if isinstance(default, int) else float(wert))
            # KEIN valueChanged->run_update: sonst löst jede Wertänderung (auch
            # beim Tippen/Scrollen) einen vollständigen Recompute aller Features
            # aus. Aktualisiert wird nur per Knopf "Vorschau" / "Körper erzeugen".

            box.addWidget(spinbox)
            grid.addLayout(box, i // 2, i % 2)
            self.inputs[key] = spinbox

    @staticmethod
    def _make_button(label, callback):
        btn = QtWidgets.QPushButton(label)
        btn.clicked.connect(callback)
        return btn

    # ------------------------------------------------------------------
    # Logik
    # ------------------------------------------------------------------

    def _collect_params(self):
        params = {k: v.value() for k, v in self.inputs.items()}
        params['rundungen'] = self.chk_rundungen.isChecked()
        return params

    # ---- Werte merken (Persistenz) -----------------------------------

    def _load_values(self):
        """Liest die zuletzt gespeicherten Feldwerte (oder {} wenn keine da)."""
        try:
            with open(_WERTE_DATEI, "r", encoding="utf-8") as f:
                daten = json.load(f)
            return daten if isinstance(daten, dict) else {}
        except Exception:
            return {}

    def _save_values(self):
        """Schreibt die aktuellen Feldwerte in die JSON-Datei."""
        try:
            with open(_WERTE_DATEI, "w", encoding="utf-8") as f:
                json.dump(self._collect_params(), f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Zahnrad: Werte konnten nicht gespeichert werden: {e}")

    def closeEvent(self, event):
        """Beim Schließen des Panels die aktuellen Werte merken."""
        self._save_values()
        super().closeEvent(event)

    # ---- Aktionen ----------------------------------------------------

    def run_update(self):
        """Vorschau (Knopf): nur das Zahnprofil-Sketch neu zeichnen."""
        if self._busy:
            return
        self._busy = True
        try:
            self.generator.generate_gear(self._collect_params())
            self._save_values()
        finally:
            self._busy = False

    def build_body(self):
        """Vollständigen Volumenkörper aufbauen (Knopf 'Körper erzeugen')."""
        if self._busy:
            return
        self._busy = True
        try:
            self.generator.build_solid(self._collect_params())
            self._save_values()
        finally:
            self._busy = False

    def build_fertigteil(self):
        """Körper bauen (falls nötig) und als einfachen Einzelkörper
        'RitzelFertig' ablegen (Knopf 'Fertigteil')."""
        if self._busy:
            return
        self._busy = True
        try:
            self.generator.make_fertigteil(self._collect_params())
            self._save_values()
        finally:
            self._busy = False

    def build_buegel(self):
        """Riemenschutz-Bügel zur aktuellen Zähnezahl als Part-Körper
        erzeugen (Knopf 'Riemenschutz-Bügel'). Nutzt Mitte-Mitte und Kopf-Ø
        aus dem Panel, damit der Bügel zum Ritzel passt."""
        if self._busy:
            return
        self._busy = True
        try:
            import FreeCAD as App
            from riemenschutz_generator import baue_buegel
            p = self._collect_params()
            z = max(12, min(18, int(p['zaehne'])))   # Bügel-Serie 12..18
            shape = baue_buegel(z, p['spitzen_abstand'], p['spitzen_d'])

            doc = App.ActiveDocument or App.newDocument("ZahnradDokument")
            # Vorhandene(n) Bügel entfernen (fester Name -> in place aktualisieren;
            # raeumt auch alte 'Riemenschutz_z<N>' aus frueheren Versionen weg).
            for o in list(doc.Objects):
                if o.Name.startswith("Riemenschutz") or \
                   (o.Label or "").startswith("Riemenschutz"):
                    doc.removeObject(o.Name)
            obj = doc.addObject("Part::Feature", "Riemenschutz")
            obj.Label = "Riemenschutz z%d" % z
            obj.Shape = shape
            doc.recompute()
            try:
                Gui.ActiveDocument.ActiveView.fitAll()
            except Exception:
                pass
            self._save_values()
            App.Console.PrintMessage("Riemenschutz-Bügel z=%d erzeugt.\n" % z)
        except Exception as e:
            import traceback
            import FreeCAD as App
            App.Console.PrintError("Bügel konnte nicht erzeugt werden: %s\n" % e)
            traceback.print_exc()
        finally:
            self._busy = False
