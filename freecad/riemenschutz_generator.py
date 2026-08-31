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

import bau_umgebung
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
FOOT_MAJ    = 8.0     # Fuss Maj (16 breit, X) — Sketch012
FOOT_MIN    = 3.06    # Fuss runde Kappe (Min, +Y) = Arm-Endkappe (kein Versatz)
FOOT_Z0     = -14.5   # Z-Unterkante des Fusses = Platten-Unterkante (buendig, kein Ueberstand)
FOOT_H      = 24.0    # Fuss -14,5..+9,5: 19 mm ueber der Platte, 24 mm gesamt (Original)
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

    # ── Fuss/Schutzwand: elliptischer Stab (vorne UND hinten rund),
    #    steht in +Z auf. Voll durch die Platte -> ein Solid. ──
    fell = Part.Ellipse(V(0.0, y_far, FOOT_Z0), FOOT_MAJ, FOOT_MIN)
    foot = Part.Face(Part.Wire([fell.toShape()])).extrude(V(0, 0, FOOT_H))

    body = plate.fuse(boss).fuse(foot).removeSplitter()

    # ── zentrale Achsbohrung (durchgehend) ──
    body = body.cut(Part.makeCylinder(BORE_R, 40.0, V(0, 0, PLATE_Z - 5.0)))

    # ── Schrauben-Sackloch: 3 mm tief von der Rueckseite (nicht durch) ──
    body = body.cut(Part.makeCylinder(
        SCREW_R, SCREW_DEPTH + 2.0, V(SCREW_X, SCREW_Y, PLATE_Z - 2.0)))

    return body


# ── Part-Design-Weg ────────────────────────────────────────────────────────
# Derselbe Buegel, gebaut als Body mit Feature-Verlauf statt als fertiges
# Shape. Dieselben Masse, dieselbe Reihenfolge wie oben — aus fuse wird ein
# additives Pad, aus cut ein Pocket. Damit sieht der Buegel im Modellbaum
# aus wie das Ritzel, wenn im Part Design gearbeitet wird.


def _origin_feature(body, role):
    """Liefert ein Ursprungs-Element des Bodys (z.B. 'XY_Plane')."""
    for feat in body.Origin.OriginFeatures:
        if getattr(feat, 'Role', '') == role:
            return feat
    return None


def _xy_sketch(body, name, z_offset):
    """Skizze auf der XY-Ebene, um z_offset angehoben. Lokale (x, y) sind
    damit die globalen (X, Y) — die Masse oben lassen sich unveraendert
    uebernehmen."""
    sk = body.newObject('Sketcher::SketchObject', name)
    sk.AttachmentSupport = [(_origin_feature(body, 'XY_Plane'), '')]
    sk.MapMode = 'FlatFace'
    sk.AttachmentOffset = App.Placement(
        App.Vector(0, 0, z_offset), App.Rotation(0, 0, 0))
    sk.Visibility = False
    return sk


def _pd_platte(body, y_far):
    """Arm-Platte: Auge-Halbkreis, zwei gerade Armkanten, ellipt. Endkappe."""
    V2 = App.Vector
    normal = V2(0, 0, 1)
    sk = _xy_sketch(body, 'BuegelPlatteSketch', PLATE_Z)
    # Auge-Halbkreis um den Ursprung, von 180 nach 360 Grad (durch -Y).
    sk.addGeometry(Part.ArcOfCircle(
        Part.Circle(V2(0, 0, 0), normal, EYE_R), math.pi, 2 * math.pi), False)
    sk.addGeometry(Part.LineSegment(V2(EYE_R, 0, 0), V2(FAR_W, y_far, 0)), False)
    # Ellipt. Endkappe (+Y): Hauptachse in X (FAR_W), Nebenachse CAP_MIN.
    sk.addGeometry(Part.ArcOfEllipse(
        Part.Ellipse(V2(0, y_far, 0), FAR_W, CAP_MIN), 0.0, math.pi), False)
    sk.addGeometry(Part.LineSegment(V2(-FAR_W, y_far, 0), V2(-EYE_R, 0, 0)), False)

    pad = body.newObject('PartDesign::Pad', 'BuegelPlattePad')
    pad.Profile = sk
    pad.Length = PLATE_T                   # 5 mm in +Z
    return pad


def _pd_boss(body):
    """Auge-Boss: ragt 1 mm in die Platte, damit er sauber verschmilzt."""
    sk = _xy_sketch(body, 'BuegelBossSketch', PLATE_Z + PLATE_T - 1.0)
    sk.addGeometry(Part.Circle(App.Vector(0, 0, 0), App.Vector(0, 0, 1),
                               BOSS_R), False)
    pad = body.newObject('PartDesign::Pad', 'BuegelBossPad')
    pad.Profile = sk
    pad.Length = BOSS_H + 1.0
    return pad


def _pd_fuss(body, y_far):
    """Fuss/Schutzwand: elliptischer Stab, steht in +Z auf und geht voll
    durch die Platte."""
    sk = _xy_sketch(body, 'BuegelFussSketch', FOOT_Z0)
    # Center/Radien-Form wie im Part-Weg: die Drei-Vektoren-Form von
    # Part.Ellipse erwartet (Hauptachsenpunkt, Nebenachsenpunkt, Mitte)
    # und nicht die Mitte zuerst.
    sk.addGeometry(Part.Ellipse(App.Vector(0, y_far, 0),
                                FOOT_MAJ, FOOT_MIN), False)
    pad = body.newObject('PartDesign::Pad', 'BuegelFussPad')
    pad.Profile = sk
    pad.Length = FOOT_H
    return pad


def _pd_bohrung(body):
    """Zentrale Achsbohrung, durch alles."""
    sk = _xy_sketch(body, 'BuegelBohrungSketch', 0.0)
    sk.addGeometry(Part.Circle(App.Vector(0, 0, 0), App.Vector(0, 0, 1),
                               BORE_R), False)
    pocket = body.newObject('PartDesign::Pocket', 'BuegelBohrung')
    pocket.Profile = sk
    pocket.Type = 'ThroughAll'
    pocket.SideType = 'Symmetric'          # in beide Richtungen durch
    return pocket


def _pd_sackloch(body):
    """Schrauben-Sackloch: 3 mm tief von der Rueckseite, nicht durch.
    Die Skizze liegt 2 mm UNTER der Plattenunterkante, geschnitten wird
    nach +Z (Reversed) — dieselbe Lage wie der Zylinder im Part-Weg."""
    sk = _xy_sketch(body, 'BuegelSacklochSketch', PLATE_Z - 2.0)
    sk.addGeometry(Part.Circle(App.Vector(SCREW_X, SCREW_Y, 0),
                               App.Vector(0, 0, 1), SCREW_R), False)
    pocket = body.newObject('PartDesign::Pocket', 'BuegelSackloch')
    pocket.Profile = sk
    pocket.Length = SCREW_DEPTH + 2.0
    pocket.Reversed = True                 # nach +Z statt nach -Z
    return pocket


def baue_buegel_body(doc, zaehne, spitzen_abstand=SPITZEN_ABSTAND,
                     spitzen_d=SPITZEN_D):
    """Baut den Buegel als Part-Design-Body und liefert ihn zurueck."""
    y_far = r_kopf(zaehne, spitzen_abstand, spitzen_d) + LEN_OFF
    body = doc.addObject('PartDesign::Body', 'Riemenschutz')
    _pd_platte(body, y_far)
    _pd_boss(body)
    _pd_fuss(body, y_far)
    _pd_bohrung(body)
    _pd_sackloch(body)
    doc.recompute()
    if not body.Shape.isValid() or body.Shape.Volume <= 0:
        raise ValueError("Riemenschutz: kein gueltiger Koerper entstanden")
    return body


def entferne_buegel(doc):
    """Entfernt vorhandene Buegel — Part-Feature wie Body, samt Inhalt.
    Raeumt auch alte 'Riemenschutz_z<N>' aus frueheren Versionen weg."""
    kandidaten = [o.Name for o in doc.Objects
                  if (o.Name or "").startswith("Riemenschutz")
                  or (o.Label or "").startswith("Riemenschutz")]
    entfernt = []
    for name in kandidaten:
        obj = doc.getObject(name)
        if obj is None:
            continue            # hing an einem schon entfernten Body
        entfernt.extend(bau_umgebung.entferne_objekt(doc, obj))
    return entfernt


def build(zaehne=17, spitzen_abstand=SPITZEN_ABSTAND, spitzen_d=SPITZEN_D):
    """Legt den Buegel im aktiven Dokument an — im Part-Arbeitsbereich als
    fertiges Shape ohne Baum, im Part Design als Body mit Feature-Verlauf."""
    z = max(12, min(18, int(zaehne)))
    doc = App.ActiveDocument or App.newDocument("Riemenschutz")
    bereich = bau_umgebung.aktiver_bereich()
    # Fester Name -> vorhandenen Buegel in place ersetzen (kein Anhaeufen).
    entferne_buegel(doc)

    if bereich == bau_umgebung.PARTDESIGN:
        obj = baue_buegel_body(doc, z, spitzen_abstand, spitzen_d)
    else:
        obj = doc.addObject("Part::Feature", "Riemenschutz")
        obj.Shape = baue_buegel(z, spitzen_abstand, spitzen_d)
    obj.Label = "Riemenschutz z%d" % z
    doc.recompute()
    # getattr statt Gui.ActiveDocument: headless ist FreeCADGui zwar
    # importierbar, hat das Attribut aber nicht — der direkte Zugriff wirft.
    if getattr(Gui, 'ActiveDocument', None):
        try:
            Gui.ActiveDocument.ActiveView.fitAll()
        except Exception:
            pass
    App.Console.PrintMessage(
        "Riemenschutz z=%d gebaut (%s, Volumen %.0f mm^3, gueltig=%s)\n"
        % (z, bau_umgebung.bereich_name(bereich), obj.Shape.Volume,
           obj.Shape.isValid()))
    return obj


# Nur bei direktem Ausfuehren in der GUI bauen — beim Import (headless) nicht.
if __name__ == "__main__":
    build()
