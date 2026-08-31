# rolle_generator.py
# Parametrische Gates-CDX-Spannrolle als echte FreeCAD-Part-Geometrie
# (B-Rep) -> STEP- und STL-Export moeglich.
#
# Die Rolle laeuft mit glatter Lauffflaeche auf dem RUECKEN des Riemens und
# drueckt ihn gegen das Ritzel. Aufbau wie ein kleines Rad: aussen der
# Laufkranz, innen die Nabe mit den beiden Flanschsitzen, dazwischen
# Speichen.
#
# Gebaut wird in zwei Schritten, beide aus geteilten Formeln:
#   1. Drehteil: rolle_geometrie.profil() liefert den Querschnitt als echte
#      Linien und Kreisboegen; daraus wird ein Wire, eine Flaeche und per
#      Revolve der Koerper. Die Kantenrundungen sind also echte Radien im
#      STEP, keine Polygonzuege.
#   2. Speichen: speichen_geometrie.kontur() liefert dieselben Durchbrueche
#      wie beim Ritzel und in der Web-Vorschau — hier nur mit den Radien der
#      Rolle. Sie werden als Prismen ueber die volle Breite abgezogen.
#
# Beide Formelquellen teilt sich diese Datei mit web/js/rolle.js und
# web/js/speichen.js; `npm test` rechnet beide Fassungen durch.
#
# Nutzung:
#   - headless:  from rolle_generator import baue_rolle
#                shape = baue_rolle(params)
#   - in FreeCAD-GUI: ueber das Bedienfeld, Knopf "Spannrolle"

import math

import FreeCAD as App
import Part

import bau_umgebung
import rolle_geometrie
import speichen_geometrie


def _kante(seg):
    """Ein Profilsegment als Part-Kante in der XZ-Ebene (r -> X, z -> Z)."""
    def v(punkt):
        return App.Vector(punkt[0], 0.0, punkt[1])

    if seg['typ'] == 'linie':
        return Part.LineSegment(v(seg['p0']), v(seg['p1'])).toShape()
    # Drei Punkte statt Winkel und Normalen: robuster und in der XZ-Ebene
    # eindeutig.
    return Part.Arc(v(seg['p0']), v(seg['pm']), v(seg['p1'])).toShape()


def _drehteil(params):
    """Der rotationssymmetrische Grundkoerper: Profil -> Flaeche -> Revolve."""
    kanten = [_kante(seg) for seg in rolle_geometrie.profil(params)]
    wire = Part.Wire(kanten)
    if not wire.isClosed():
        raise ValueError("Drehprofil der Rolle ist nicht geschlossen")
    face = Part.Face(wire)
    return face.revolve(App.Vector(0, 0, 0), App.Vector(0, 0, 1), 360)


def _speichen_schnitt(params):
    """Die Durchbrueche als ein Schneidkoerper — oder None, wenn der freie
    Ring zu schmal ist. Dann bleibt der Steg voll, genau wie beim Ritzel."""
    n = int(round(params.get('speichen_n', 0)))
    if n < 3 or params.get('speichen_b', 0) <= 0:
        return None

    r_innen, r_aussen = rolle_geometrie.ring_radien(params)
    ergebnis = speichen_geometrie.kontur(
        n, params['speichen_b'], r_innen, r_aussen,
        params.get('speichen_r', 0.0), 0.0)      # die Rolle laeuft radial
    oeffnungen = ergebnis['oeffnungen']
    if not oeffnungen:
        print("Rolle: freier Ring nur %.1f mm (noetig %.0f mm) — Steg bleibt voll."
              % (r_aussen - r_innen, speichen_geometrie.MIN_RING))
        return None

    tiefe = params['rolle_b'] + 2.0          # sicher durch beide Stirnflaechen
    prismen = []
    for oeffnung in oeffnungen:
        kanten = []
        for seg in oeffnung:
            if seg['typ'] == 'linie':
                kanten.append(Part.LineSegment(
                    App.Vector(seg['p0'][0], seg['p0'][1], 0),
                    App.Vector(seg['p1'][0], seg['p1'][1], 0)).toShape())
                continue
            # Drei Punkte statt Winkel: speichen.js sortiert a0/a1 gegen den
            # Uhrzeigersinn und merkt die tatsaechliche Durchlaufrichtung
            # getrennt in `ccw`. Ueber Winkel gebaut kaemen die Endpunkte bei
            # rueckwaerts laufenden Segmenten vertauscht heraus, und der
            # Umriss schloesse nicht. p0/pm/p1 stimmen dagegen immer.
            a0, a1 = seg['a0'], seg['a1']
            if a1 < a0:
                a1 += 2 * math.pi
            am = (a0 + a1) / 2.0
            pm = (seg['c'][0] + seg['r'] * math.cos(am),
                  seg['c'][1] + seg['r'] * math.sin(am))
            kanten.append(Part.Arc(
                App.Vector(seg['p0'][0], seg['p0'][1], 0),
                App.Vector(pm[0], pm[1], 0),
                App.Vector(seg['p1'][0], seg['p1'][1], 0)).toShape())
        flaeche = Part.Face(Part.Wire(kanten))
        prismen.append(flaeche.extrude(App.Vector(0, 0, tiefe)))

    schnitt = prismen[0]
    for weiterer in prismen[1:]:
        schnitt = schnitt.fuse(weiterer)
    schnitt.translate(App.Vector(0, 0, -tiefe / 2.0))
    return schnitt


def _speichen_kanten_runden(koerper, params):
    """Verrundet die Muendungskanten der Speichen-Durchbrueche an beiden
    Stirnflaechen (z = +-rolle_b/2). Radius aus 'speichen_kante', 0 = scharf.

    Wie beim Ritzel eine Kaskade: geht der Wunschradius nicht, wird er
    schrittweise kleiner. Geht gar keiner, bleiben die Kanten scharf — eine
    scharfe Kante ist besser als gar keine Rolle."""
    radius = float(params.get('speichen_kante', 0.0) or 0.0)
    if radius <= 0 or int(round(params.get('speichen_n', 0))) < 3:
        return koerper

    r_innen, r_aussen = rolle_geometrie.ring_radien(params)
    zmax = params['rolle_b'] / 2.0

    def muendungskante(kante):
        """Liegt die Kante ganz in einer Stirnflaeche und im Speichenring?
        Die Waende im Inneren des Durchbruchs bleiben damit aussen vor."""
        if not kante.Vertexes:
            return False
        for v in kante.Vertexes:
            if abs(abs(v.Point.z) - zmax) > 0.05:
                return False
            r = math.hypot(v.Point.x, v.Point.y)
            if not (r_innen - 0.3 <= r <= r_aussen + 0.3):
                return False
        return True

    kanten = [k for k in koerper.Edges if muendungskante(k)]
    if not kanten:
        print("Rolle: keine Oeffnungskanten gefunden — Kanten bleiben scharf.")
        return koerper

    r = min(radius, zmax - 0.05)
    while r >= 0.1:
        try:
            gerundet = koerper.makeFillet(r, kanten)
            if gerundet.isValid() and gerundet.Volume > 0:
                if r < radius:
                    print("Rolle: Kantenradius %.2f mm statt %.2f mm — mehr "
                          "gab die Geometrie nicht her." % (r, radius))
                return gerundet
        except Exception:
            pass
        # Grosse Radien halbieren, kleine in 0,1er-Schritten: OCC-Fillets
        # sind nicht monoton, grobe Schritte uebergingen machbare Radien.
        r = round(r / 2.0, 2) if r > 1.2 else round(r - 0.1, 2)
    print("Rolle: Oeffnungskanten nicht verrundbar — bleiben scharf.")
    return koerper


def baue_rolle(params):
    """Liefert die fertige Spannrolle als Part.Shape (Solid).

    Wirft ValueError, wenn die Masse keinen Koerper hergeben — dieselbe
    Pruefung wie in der Web-Vorschau (rolle_geometrie.maengel)."""
    fehlt = rolle_geometrie.maengel(params)
    if fehlt:
        raise ValueError("Spannrolle mit diesen Massen nicht baubar: "
                         + ", ".join(fehlt))

    koerper = _drehteil(params)
    schnitt = _speichen_schnitt(params)
    if schnitt is not None:
        # removeSplitter vor dem Runden: der Schnitt hinterlaesst geteilte
        # Flaechen, deren Naehte der Fillet sonst als eigene Kanten sieht.
        koerper = koerper.cut(schnitt).removeSplitter()
        koerper = _speichen_kanten_runden(koerper, params)

    koerper = koerper.removeSplitter()
    if not koerper.isValid() or koerper.Volume <= 0:
        raise ValueError("Spannrolle: kein gueltiger Koerper entstanden")
    return koerper


# ── Part-Design-Weg ────────────────────────────────────────────────────────
# Dieselbe Rolle, gebaut als Body mit Feature-Verlauf statt als fertiges
# Shape. Die Formeln sind unveraendert dieselben (rolle_geometrie,
# speichen_geometrie) — nur die Bauweise unterscheidet sich, damit die Rolle
# im Modellbaum aussieht wie das Ritzel, wenn im Part Design gearbeitet wird.


def _origin_feature(body, role):
    """Liefert ein Ursprungs-Element des Bodys (z.B. 'XZ_Plane', 'Z_Axis')."""
    for feat in body.Origin.OriginFeatures:
        if getattr(feat, 'Role', '') == role:
            return feat
    return None


def _pd_drehteil(body, params):
    """Drehprofil als Skizze in der XZ-Ebene + Revolution um die Z-Achse.
    Im Sketch heisst lokal x = radial, lokal y = axial — genau das (r, z),
    das rolle_geometrie.profil() liefert."""
    sk = body.newObject('Sketcher::SketchObject', 'RolleProfilSketch')
    sk.AttachmentSupport = [(_origin_feature(body, 'XZ_Plane'), '')]
    sk.MapMode = 'FlatFace'
    normal = App.Vector(0, 0, 1)
    for seg in rolle_geometrie.profil(params):
        if seg['typ'] == 'linie':
            sk.addGeometry(Part.LineSegment(
                App.Vector(seg['p0'][0], seg['p0'][1], 0),
                App.Vector(seg['p1'][0], seg['p1'][1], 0)), False)
            continue
        a0, a1 = seg['a0'], seg['a1']
        if a1 <= a0:
            a1 += 2 * math.pi              # ArcOfCircle laeuft gegen den UZS
        sk.addGeometry(Part.ArcOfCircle(
            Part.Circle(App.Vector(seg['c'][0], seg['c'][1], 0), normal,
                        seg['r']),
            a0, a1), False)
    sk.Visibility = False

    rev = body.newObject('PartDesign::Revolution', 'RolleDrehteil')
    rev.Profile = sk
    # V_Axis der Skizze = senkrechte Achse in der XZ-Ebene = globale Z-Achse.
    rev.ReferenceAxis = (sk, ['V_Axis'])
    rev.Angle = 360.0
    return rev


def _pd_speichen(body, params):
    """Die Durchbrueche als EIN Pocket 'ThroughAll' — dieselbe Kontur wie im
    Part-Weg und beim Ritzel. Liefert (r_innen, r_aussen) fuer die spaetere
    Kantenverrundung, oder None, wenn der Ring zu schmal ist."""
    n = int(round(params.get('speichen_n', 0)))
    if n < 3 or params.get('speichen_b', 0) <= 0:
        return None

    r_innen, r_aussen = rolle_geometrie.ring_radien(params)
    ergebnis = speichen_geometrie.kontur(
        n, params['speichen_b'], r_innen, r_aussen,
        params.get('speichen_r', 0.0), 0.0)      # die Rolle laeuft radial
    oeffnungen = ergebnis['oeffnungen']
    if not oeffnungen:
        print("Rolle: freier Ring nur %.1f mm (noetig %.0f mm) — Steg bleibt voll."
              % (r_aussen - r_innen, speichen_geometrie.MIN_RING))
        return None

    sk = body.newObject('Sketcher::SketchObject', 'RolleSpeichenSketch')
    sk.AttachmentSupport = [(_origin_feature(body, 'XY_Plane'), '')]
    sk.MapMode = 'FlatFace'
    normal = App.Vector(0, 0, 1)
    for oeffnung in oeffnungen:
        for seg in oeffnung:
            if seg['typ'] == 'linie':
                sk.addGeometry(Part.LineSegment(
                    App.Vector(seg['p0'][0], seg['p0'][1], 0),
                    App.Vector(seg['p1'][0], seg['p1'][1], 0)), False)
                continue
            a0, a1 = seg['a0'], seg['a1']
            if a1 <= a0:
                a1 += 2 * math.pi
            sk.addGeometry(Part.ArcOfCircle(
                Part.Circle(App.Vector(seg['c'][0], seg['c'][1], 0), normal,
                            seg['r']),
                a0, a1), False)
    sk.Visibility = False

    pocket = body.newObject('PartDesign::Pocket', 'RolleSpeichenPocket')
    pocket.Profile = sk
    pocket.Type = 'ThroughAll'
    pocket.SideType = 'Symmetric'          # in beide Richtungen durch
    return (r_innen, r_aussen)


def _pd_speichen_kanten(doc, body, params, ring):
    """Muendungskanten der Durchbrueche an beiden Stirnflaechen verrunden.
    Radius-Kaskade wie im Part-Weg: geht der Wunschradius nicht, wird er
    kleiner; geht gar keiner, bleiben die Kanten scharf."""
    radius = float(params.get('speichen_kante', 0.0) or 0.0)
    if radius <= 0 or not ring:
        return
    r_innen, r_aussen = ring
    zmax = params['rolle_b'] / 2.0

    doc.recompute()                        # Kanten muessen berechnet sein
    tip = body.Tip
    namen = []
    for i, kante in enumerate(tip.Shape.Edges):
        if not kante.Vertexes:
            continue
        passt = True
        for v in kante.Vertexes:
            if abs(abs(v.Point.z) - zmax) > 0.05:
                passt = False
                break
            r = math.hypot(v.Point.x, v.Point.y)
            if not (r_innen - 0.3 <= r <= r_aussen + 0.3):
                passt = False
                break
        if passt:
            namen.append('Edge%d' % (i + 1))
    if not namen:
        print("Rolle: keine Oeffnungskanten gefunden — Kanten bleiben scharf.")
        return

    prev_tip = body.Tip
    fil = body.newObject('PartDesign::Fillet', 'RolleKantenFillet')
    fil.Base = (tip, namen)
    r = min(radius, zmax - 0.05)
    while r >= 0.1:
        try:
            fil.Radius = r
            doc.recompute()
            if body.Shape.isValid() and 'Invalid' not in ' '.join(fil.State):
                if r < radius:
                    print("Rolle: Kantenradius %.2f mm statt %.2f mm — mehr "
                          "gab die Geometrie nicht her." % (r, radius))
                return
        except Exception:
            pass
        # Grosse Radien halbieren, kleine in 0,1er-Schritten: OCC-Fillets
        # sind nicht monoton, grobe Schritte uebergingen machbare Radien.
        r = round(r / 2.0, 2) if r > 1.2 else round(r - 0.1, 2)
    print("Rolle: Oeffnungskanten nicht verrundbar — bleiben scharf.")
    doc.removeObject(fil.Name)
    body.Tip = prev_tip
    doc.recompute()


def baue_rolle_body(doc, params):
    """Baut die Spannrolle als Part-Design-Body und liefert ihn zurueck.

    Wirft ValueError bei unbaubaren Massen — dieselbe Pruefung wie im
    Part-Weg (rolle_geometrie.maengel)."""
    fehlt = rolle_geometrie.maengel(params)
    if fehlt:
        raise ValueError("Spannrolle mit diesen Massen nicht baubar: "
                         + ", ".join(fehlt))

    body = doc.addObject('PartDesign::Body', 'Spannrolle')
    _pd_drehteil(body, params)
    ring = _pd_speichen(body, params)
    doc.recompute()
    if ring:
        _pd_speichen_kanten(doc, body, params, ring)
    doc.recompute()

    if not body.Shape.isValid() or body.Shape.Volume <= 0:
        raise ValueError("Spannrolle: kein gueltiger Koerper entstanden")
    return body


def entferne_rollen(doc):
    """Entfernt vorhandene Spannrollen — egal, auf welchem Weg sie entstanden
    sind. Der Bau im Fenster legt "Spannrolle" an (Part-Feature oder Body);
    der Hintergrundbau importiert die STEP und erbt deren Dateinamen,
    "spannrolle_d40_b14", also KLEIN geschrieben. Der frühere Vergleich mit
    startswith("Spannrolle") sah die importierte nicht: wer beide Wege
    benutzte, bekam bei jeder Änderung eine weitere Rolle daneben, statt
    die bestehende zu ersetzen. Darum hier case-unabhängig und an einer
    Stelle für beide Wege.
    """
    # Erst die Namen einsammeln, dann abraeumen: beim Entfernen eines Bodys
    # verschwinden auch dessen Features aus dem Dokument, und schon der
    # Zugriff auf .Name eines geloeschten Objekts wirft.
    kandidaten = [obj.Name for obj in doc.Objects
                  if ((obj.Name or "").lower().startswith("spannrolle")
                      or (obj.Label or "").lower().startswith("spannrolle"))]
    entfernt = []
    for name in kandidaten:
        obj = doc.getObject(name)
        if obj is None:
            continue            # hing an einem schon entfernten Body
        entfernt.extend(bau_umgebung.entferne_objekt(doc, obj))
    return entfernt


def build(params=None):
    """Legt die Rolle im aktiven Dokument an — im Part-Arbeitsbereich als
    fertiges Shape ohne Baum, im Part Design als Body mit Feature-Verlauf.
    So sieht die Rolle im Modellbaum aus wie das, womit gerade gearbeitet
    wird. Ein vorhandenes Objekt gleichen Namens wird ersetzt, damit
    wiederholtes Bauen den Baum nicht zumuellt."""
    if params is None:
        import zahnrad_params
        params = {key: std for key, _label, std
                  in zahnrad_params.default_fields('rolle')}

    doc = App.ActiveDocument or App.newDocument("ZahnradDokument")
    bereich = bau_umgebung.aktiver_bereich()
    entferne_rollen(doc)

    if bereich == bau_umgebung.PARTDESIGN:
        obj = baue_rolle_body(doc, params)
    else:
        obj = doc.addObject("Part::Feature", "Spannrolle")
        obj.Shape = baue_rolle(params)
    obj.Label = "Spannrolle Ø%.0f × %.0f" % (params['rolle_d'], params['rolle_b'])
    doc.recompute()
    return obj
