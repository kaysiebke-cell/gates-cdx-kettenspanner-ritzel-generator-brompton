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
        koerper = koerper.cut(schnitt)

    koerper = koerper.removeSplitter()
    if not koerper.isValid() or koerper.Volume <= 0:
        raise ValueError("Spannrolle: kein gueltiger Koerper entstanden")
    return koerper


def build(params=None):
    """Legt die Rolle als Vorschauobjekt im aktiven Dokument an (GUI-Weg).
    Ein vorhandenes Objekt gleichen Namens wird ersetzt, damit wiederholtes
    Bauen den Baum nicht zumuellt."""
    if params is None:
        import zahnrad_params
        params = {key: std for key, _label, std
                  in zahnrad_params.default_fields('rolle')}

    shape = baue_rolle(params)
    doc = App.ActiveDocument or App.newDocument("ZahnradDokument")
    for obj in list(doc.Objects):
        if obj.Name.startswith("Spannrolle") or \
           (obj.Label or "").startswith("Spannrolle"):
            doc.removeObject(obj.Name)
    obj = doc.addObject("Part::Feature", "Spannrolle")
    obj.Label = "Spannrolle Ø%.0f × %.0f" % (params['rolle_d'], params['rolle_b'])
    obj.Shape = shape
    doc.recompute()
    return obj
