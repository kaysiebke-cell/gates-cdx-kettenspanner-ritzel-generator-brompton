# rolle_geometrie.py
# Kontur-Mathematik der glatten Spannrolle. Zwillingsdatei zu
# web/js/rolle.js — Formel fuer Formel identisch. Aenderungen bitte IMMER in
# beiden Dateien; tools/golden-test.mjs rechnet beide Fassungen durch und
# meldet jede Abweichung.
#
# Die Rolle laeuft mit glatter Lauffflaeche auf dem RUECKEN des CDX-Riemens
# und drueckt ihn gegen das Ritzel. Aufbau wie ein kleines Rad: aussen der
# Laufkranz, innen die Nabe mit den beiden Flanschsitzen, dazwischen
# Speichen. Die Durchbrueche rechnet speichen_geometrie.py — dasselbe Modul
# wie beim Ritzel, es bekommt hier nur andere Radien.
#
# Bewusst OHNE FreeCAD-Import: so laeuft die Datei im Abgleichtest mit
# blossem python3.

import math

# Kleinste sinnvolle Wandstaerken [mm].
MIN_KRANZ = 1.0    # Lauffflaeche nach innen
MIN_NABE = 1.0     # Material zwischen Bohrung und Nabenaussen


def radien(p):
    """Die radialen Kennmasse.

    r_aussen       Lauffflaeche (Aussenmass der ganzen Rolle)
    r_kranz_innen  Innenkante des Laufkranzes — hier enden die Speichen aussen
    r_nabe         Nabenaussenrand — hier setzen die Speichen innen an
    r_bohrung      zentrale Wellenbohrung
    r_lager        Flanschsenkung an beiden Stirnseiten
    """
    r_aussen = p['rolle_d'] / 2.0
    r_kranz_innen = r_aussen - p['rolle_wand']
    r_nabe = p['nabe_d'] / 2.0
    r_bohrung = p['bohrung_d'] / 2.0
    r_lager = p['lager_d'] / 2.0
    return {
        'r_aussen': r_aussen,
        'r_kranz_innen': r_kranz_innen,
        'r_nabe': r_nabe,
        'r_bohrung': r_bohrung,
        'r_lager': r_lager,
    }


def ring_radien(p):
    """Radien, mit denen speichen_geometrie.py rechnet: aussen die
    Kranzinnenkante, innen der Nabenrand. Anders als beim Ritzel gibt es
    keinen Wand-Aufschlag — Kranzdicke und Nabe sind hier eigene Felder."""
    r = radien(p)
    return r['r_nabe'], r['r_kranz_innen']


def maengel(p):
    """Liste der Gruende, warum die Rolle so nicht baubar ist —
    leer heisst: alles in Ordnung. Reihenfolge wie in rolle.js."""
    r = radien(p)
    m = []
    if not p['rolle_d'] > 0:
        m.append('aussen_d')
    if not p['rolle_b'] > 0:
        m.append('breite')
    if p['rolle_wand'] < MIN_KRANZ:
        m.append('kranz_duenn')
    # Reicht der Kranz bis an die Nabe oder darueber hinaus, ist die Rolle
    # einfach voll — das ist ein gueltiger Koerper, nur eben ohne Speichen.
    # Unbaubar wird es erst, wenn aussen nichts mehr ueber der Nabe steht.
    if r['r_aussen'] <= r['r_nabe']:
        m.append('kranz_fehlt')
    if r['r_nabe'] - r['r_bohrung'] < MIN_NABE:
        m.append('nabe_duenn')
    if r['r_lager'] > 0 and r['r_lager'] <= r['r_bohrung']:
        m.append('lagersitz_zu_klein')
    if r['r_lager'] >= r['r_nabe']:
        m.append('lagersitz_ueber_nabe')
    if p['lager_t'] * 2 >= p['rolle_b']:
        m.append('lagersitz_zu_tief')
    return m


def kanten_radius(p):
    """Verrundung der vier Lauffflaechenkanten. Sie darf weder halbe
    Kranzdicke noch halbe Breite ueberschreiten."""
    return max(0.0, min(p['kante_r'], p['rolle_wand'] / 2.0, p['rolle_b'] / 2.0))


def voll_volumen(p):
    """Volumen des vollen Rings ohne Speichen [mm^3] — Kranz plus Nabe plus
    Steg, abzueglich Bohrung und der beiden Flanschsenkungen. Die
    Kantenrundung ist darin NICHT abgezogen — bei R 0,8 sind das rund
    70 mm^3 oder ein halbes Prozent (am gerenderten Koerper nachgemessen)."""
    r = radien(p)

    def kreis(rad):
        return math.pi * rad * rad

    v = (kreis(r['r_aussen']) - kreis(r['r_bohrung'])) * p['rolle_b']
    if r['r_lager'] > r['r_bohrung']:
        v -= (kreis(r['r_lager']) - kreis(r['r_bohrung'])) * p['lager_t'] * 2
    return v
