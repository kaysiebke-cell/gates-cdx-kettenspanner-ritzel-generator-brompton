"""Prueft die reine Python-Logik von zahnrad_generator.py gegen eine
Attrappe der FreeCAD-API (tools/freecad_attrappe.py) — Kantenklassifizierung,
Kantensuche auf den Stirnflaechen und die Radius-Kaskade samt Fehlerpfad.

Was das NICHT leistet: ob OCC die Fillets tatsaechlich baut. Das zeigt erst
FreeCAD selbst. Geprueft wird der Teil, in dem wir Fehler machen — welche
Kanten in welche Verrundung wandern und was bei einem Fehlschlag passiert.

    python3 tools/test_generator_logik.py
"""

import os
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.dirname(HIER)
sys.path.insert(0, HIER)
sys.path.insert(0, os.path.join(WURZEL, 'freecad'))

import freecad_attrappe as M          # noqa: E402  (setzt sys.modules)
from zahnrad_generator import ZahnradVollGenerator   # noqa: E402

g = ZahnradVollGenerator()
g._geo_fp = 'test'
g._cache_lesen = lambda: {}
g._cache_merken = lambda *a: None

# Ring wie bei 18 Zaehnen mit Standardwerten
ri, ra, breite = 12.0, 19.97, 11.0
g._speichen_ring = (ri, ra)

# Kanten: 2 Speichenkanten (im Ring), 1 Zahnkontur (aussen), 1 Nabenkreis
k_speiche1 = M.Kante([(13.0, 0, 5.5), (18.0, 1.0, 5.5)])
k_speiche2 = M.Kante([(12.5, 2.0, 5.5), (19.0, 3.0, 5.5)])
k_zahn     = M.Kante([(25.2, 0, 5.5), (28.0, 1.0, 5.5)])
k_nabe     = M.Kante([(10.0, 0, 5.5)], closed=True, radius=10.0, mitte=(0, 0, 5.5))
oben  = M.Flaeche(5.5,  [k_speiche1, k_speiche2, k_zahn, k_nabe], area=500)
unten = M.Flaeche(-5.5, [], area=500)
klein = M.Flaeche(5.5,  [k_zahn], area=5)          # kleinere Flaeche, darf verlieren
form = M.Form([oben, unten, klein], [k_speiche1, k_speiche2, k_zahn, k_nabe])

print('1) Kantenklassifizierung')
for name, k, erwartet in [('Speiche 1', k_speiche1, True), ('Speiche 2', k_speiche2, True),
                          ('Zahnkontur', k_zahn, False), ('Nabenkreis', k_nabe, False)]:
    ist = g._ist_speichen_kante(k)
    print(f'   {name:12} als Speichenkante erkannt: {ist}  {"ok" if ist == erwartet else "FALSCH"}')

print('2) Kantensuche auf den Stirnflaechen')
alle = g._stirnflaechen_kanten(form, breite, lambda e: True)
nur_speichen = g._stirnflaechen_kanten(form, breite, g._ist_speichen_kante)
ohne_speichen = g._stirnflaechen_kanten(form, breite,
    lambda e: not (g._ist_zentrale_kreiskante(e) or g._ist_speichen_kante(e)))
print(f'   alle {alle} | nur Speichen {nur_speichen} | Zahn-Rundung {ohne_speichen}')
assert nur_speichen == ['Edge1', 'Edge2'], nur_speichen
assert ohne_speichen == ['Edge3'], ohne_speichen

print('3) Kaskade: gueltiger Radius beim ersten Versuch')
doc, body = M.Doc(), M.Body(form)
body.Tip = 'vorher'
ok = g._kaskade(doc, body, 'SpeichenFillet', 'Speichen-Kantenbruch', 'tip',
                nur_speichen, 0.4, 'speichen_kante', lambda r: round(r - 0.1, 2))
print(f'   Ergebnis {ok}, erzeugt {body.erzeugt}, entfernt {doc.entfernt}')
assert ok and body.erzeugt == [('PartDesign::Fillet', 'SpeichenFillet')] and not doc.entfernt

print('4) Kaskade: OCC lehnt jeden Radius ab -> Feature muss verschwinden')
class KaputterBody(M.Body):
    def newObject(self, typ, name):
        o = super().newObject(typ, name)
        o.__class__ = type('Ungueltig', (M.Fillet,), {'State': ['Invalid']})
        return o
doc2, body2 = M.Doc(), KaputterBody(form)
body2.Tip = 'vorher'
ok2 = g._kaskade(doc2, body2, 'SpeichenFillet', 'Speichen-Kantenbruch', 'tip',
                 nur_speichen, 0.4, 'speichen_kante', lambda r: round(r - 0.1, 2))
print(f'   Ergebnis {ok2}, entfernt {doc2.entfernt}, Tip zurueckgesetzt auf {body2.Tip!r}')
assert not ok2 and doc2.entfernt == ['SpeichenFillet'] and body2.Tip == 'vorher'

print('5) _add_speichen_verrundung: ohne Speichen darf nichts passieren')
g._speichen_ring = None
doc3, body3 = M.Doc(), M.Body(form)
g._add_speichen_verrundung(doc3, body3, breite, 0.4)
print(f'   erzeugt {body3.erzeugt}')
assert body3.erzeugt == []

print('\n\u2713 Generator-Logik: alle Pruefungen bestanden.')
