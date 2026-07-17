# riemenschutz_generator.py
# Parametrischer CDX-Riemenschutz-Buegel als echte FreeCAD-Part-Geometrie
# (B-Rep) -> STEP- und STL-Export moeglich. Masse 1:1 aus den echten
# handgebauten FCStd-Buegeln (Sketch010/012/013/014) reverse-engineert:
# feste Form, nur die Armlaenge waechst mit der Zaehnezahl (ueber rKopf).
#
# Koordinaten wie in den FCStd/STL, damit der Buegel zum Ritzel sitzt:
# Auge/Bohrung auf der Ritzelachse im Ursprung, Arm in +Y, Fuss steht in +Z.
#
# Nutzung:
#   - headless: from riemenschutz_generator import baue_buegel
#               shape = baue_buegel(zaehne, spitzen_abstand, spitzen_d)
#   - in FreeCAD-GUI:  Datei ausfuehren -> legt ein Vorschauobjekt an (build()).

import math
import FreeCAD as App
import Part
try:
    import FreeCADGui as Gui
except Exception:
    Gui = None

# ── Feste Masse (aus den echten Sketches ausgelesen) ────────────────────────
EYE_R       = 10.0    # Auge/Arm-Halbbreite (Sketch010 Bogen R10)
FAR_W       = 8.0     # Halbbreite am fernen Armende (Verjuengung 10->8)
CAP_MIN     = 3.06    # ellipt. Endkappe des Arms (Maj 8 / Min 3,06)
LEN_OFF     = 8.0     # fernes Armende Y = rKopf + LEN_OFF (Kappe bringt +3)
PLATE_T     = 5.0     # Dicke der Arm-Platte (Pad007)
PLATE_Z     = -14.5   # Z-Unterkante der Arm-Platte (Oberseite bei -9,5)
BORE_R      = 2.70    # zentrale Achsbohrung (Oe 5,4) -> durchgehend
BOSS_R      = 4.50    # Auge-Boss aussen (Sketch013)
BOSS_H      = 2.0     # Boss-Hoehe (Pad008)
FOOT_MAJ    = 8.0     # Fuss-Ellipse Maj (16 breit, X) — Sketch012
FOOT_MIN    = 3.0     # Fuss-Ellipse Min (6 tief, Y)
FOOT_Z0     = -16.5   # Z-Unterkante des Fusses (wie echtes STL; durch die Platte -> 1 Solid)
FOOT_H      = 24.0    # Fuss -16,5..+7,5 (Oberkante +7,5 wie gemessen)
SCREW_R     = 1.70    # Schrauben-Sackloch (Oe 3,4)
SCREW_X     = 5.05    # Schrauben-Sackloch Zentrum X (aus STL gemessen)
SCREW_Y     = 5.03    # Schrauben-Sackloch Zentrum Y (+Y-Seite, ~45°)
SCREW_DEPTH = 3.0     # Tiefe des Sacklochs von HINTEN

# Ritzel-Standardkennwerte (nur zur GUI-Vorschau; headless kommen sie mit)
SPITZEN_ABSTAND = 10.20
SPITZEN_D       = 2.80


def r_kopf(zaehne, spitzen_abstand=SPITZEN_ABSTAND, spitzen_d=SPITZEN_D):
    """Kopfkreis-Radius (Zahnspitze) — exakt wie im Zahnrad-Generator."""
    z = int(zaehne)
    return spitzen_abstand / (2.0 * math.sin(math.pi / z)) + spitzen_d / 2.0


def baue_buegel(zaehne, spitzen_abstand=SPITZEN_ABSTAND, spitzen_d=SPITZEN_D):
    """Liefert den fertigen Buegel als Part.Shape (Solid)."""
    V = App.Vector
    y_far = r_kopf(zaehne, spitzen_abstand, spitzen_d) + LEN_OFF

    # ── Arm-Platte: geschlossener Umriss in der XY-Ebene (z = PLATE_Z) ──
    pL  = V(-EYE_R, 0.0, PLATE_Z)          # (-10, 0)
    pR  = V(EYE_R, 0.0, PLATE_Z)           # ( 10, 0)
    pFR = V(FAR_W, y_far, PLATE_Z)         # (  8, y_far)
    pFL = V(-FAR_W, y_far, PLATE_Z)        # ( -8, y_far)

    arc_eye = Part.Arc(pL, V(0.0, -EYE_R, PLATE_Z), pR)   # Auge-Halbkreis (-Y)
    line_r  = Part.LineSegment(pR, pFR)                   # rechte Armkante
    ell_cap = Part.Ellipse(V(0.0, y_far, PLATE_Z), FAR_W, CAP_MIN)
    arc_cap = Part.ArcOfEllipse(ell_cap, 0.0, math.pi)    # ellipt. Endkappe (+Y)
    line_l  = Part.LineSegment(pFL, pL)                   # linke Armkante

    wire = Part.Wire([arc_eye.toShape(), line_r.toShape(),
                      arc_cap.toShape(), line_l.toShape()])
    plate = Part.Face(wire).extrude(V(0, 0, PLATE_T))     # 5 mm in +Z

    # ── Auge-Boss (Ring): 1 mm in die Platte fuer sauberen Merge ──
    boss = Part.makeCylinder(BOSS_R, BOSS_H + 1.0, V(0, 0, PLATE_Z + PLATE_T - 1.0))

    # ── Fuss/Abwinklung: elliptischer Stab (16x6), steht in +Z auf ──
    ell_foot = Part.Ellipse(V(0.0, y_far, FOOT_Z0), FOOT_MAJ, FOOT_MIN)
    foot = Part.Face(Part.Wire([ell_foot.toShape()])).extrude(V(0, 0, FOOT_H))

    body = plate.fuse(boss).fuse(foot).removeSplitter()

    # ── zentrale Achsbohrung (durchgehend) ──
    body = body.cut(Part.makeCylinder(BORE_R, 40.0, V(0, 0, PLATE_Z - 5.0)))

    # ── Schrauben-Sackloch: 3 mm tief von der Rueckseite (nicht durch) ──
    body = body.cut(Part.makeCylinder(
        SCREW_R, SCREW_DEPTH + 2.0, V(SCREW_X, SCREW_Y, PLATE_Z - 2.0)))

    return body


def build(zaehne=17):
    """GUI-Vorschau: legt den Buegel als Part::Feature ins aktive Dokument."""
    z = max(12, min(18, int(zaehne)))
    doc = App.ActiveDocument or App.newDocument("Riemenschutz")
    shape = baue_buegel(z)
    name = "Riemenschutz_z%d" % z
    old = doc.getObject(name)
    if old:
        doc.removeObject(old.Name)
    obj = doc.addObject("Part::Feature", name)
    obj.Shape = shape
    doc.recompute()
    if Gui and Gui.ActiveDocument:
        try:
            Gui.ActiveDocument.ActiveView.fitAll()
        except Exception:
            pass
    App.Console.PrintMessage(
        "Riemenschutz z=%d gebaut (Volumen %.0f mm^3, gueltig=%s)\n"
        % (z, shape.Volume, shape.isValid()))
    return obj


# Nur bei direktem Ausfuehren in der GUI bauen — beim Import (headless) nicht.
if __name__ == "__main__":
    build()
