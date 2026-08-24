"""Minimale Attrappe der FreeCAD-API (nur fuer tools/test_generator_logik.py) — genug, um die reine Python-Logik des
Generators (Kantensuche, Kaskade, Speichen-Sketch) ohne FreeCAD zu pruefen."""
import sys, types, math

class Vector:
    def __init__(self, x=0, y=0, z=0): self.x, self.y, self.z = x, y, z
class Rotation:
    def __init__(self, *a): pass
    def multiply(self, o): return self
class Placement:
    def __init__(self, *a): pass

App = types.ModuleType('FreeCAD')
App.Vector, App.Rotation, App.Placement = Vector, Rotation, Placement
App.ActiveDocument, App.GuiUp = None, False
App.newDocument = lambda n=None: None
Gui = types.ModuleType('FreeCADGui'); Gui.ActiveDocument = None
Part = types.ModuleType('Part')
class _Geo:
    def __init__(self, *a, **k): self.args = a
Part.Circle = Part.ArcOfCircle = Part.LineSegment = _Geo
sys.modules['FreeCAD'], sys.modules['FreeCADGui'], sys.modules['Part'] = App, Gui, Part

# ── Formkoerper-Attrappe ─────────────────────────────────────────────────
class Punkt:
    def __init__(self, x, y, z): self.Point = Vector(x, y, z)
class Kante:
    def __init__(self, punkte, closed=False, radius=None, mitte=None):
        self.Vertexes = [Punkt(*p) for p in punkte]
        self.Closed, self.Curve = closed, types.SimpleNamespace()
        if radius is not None: self.Curve.Radius = radius
        # Ein geschlossener Kreis hat seinen Schwerpunkt im Mittelpunkt,
        # nicht auf dem Rand — sonst greift _ist_zentrale_kreiskante nicht.
        self.CenterOfMass = Vector(*(mitte if mitte else
            [sum(p[i] for p in punkte)/len(punkte) for i in range(3)]))
    def isSame(self, other): return self is other
class Plane:                     # heisst absichtlich 'Plane': der Generator
    def __init__(self):          # prueft Surface.__class__.__name__
        self.Axis = Vector(0, 0, 1)
class Flaeche:
    def __init__(self, z, kanten, area):
        self.Surface = Plane()
        self.BoundBox = types.SimpleNamespace(ZMin=z, ZMax=z)
        self.Edges, self.Area = kanten, area
class Form:
    def __init__(self, faces, edges): self.Faces, self.Edges = faces, edges
    def isValid(self): return True

class Fillet:
    Name = 'Fillet'
    def __init__(self, name): self.Name, self.Base, self.Radius = name, None, None
    @property
    def State(self): return ['Valid']
class Body:
    def __init__(self, shape): self.Tip, self.Shape, self.erzeugt = None, shape, []
    def newObject(self, typ, name):
        o = Fillet(name); self.erzeugt.append((typ, name)); return o
class Doc:
    def __init__(self): self.entfernt = []
    def recompute(self): pass
    def removeObject(self, n): self.entfernt.append(n)
    def getObject(self, n): return None
