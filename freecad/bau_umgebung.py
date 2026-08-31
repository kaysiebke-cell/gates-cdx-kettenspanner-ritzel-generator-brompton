# bau_umgebung.py
# Erkennt, in welchem FreeCAD-Arbeitsbereich gerade gearbeitet wird, damit
# jedes Bauteil so entsteht wie der Rest im Dokument — im Part-Arbeitsbereich
# als ein fertiger Koerper ohne Baum, im Part-Design-Arbeitsbereich als Body
# mit Feature-Verlauf. Kein Mischmasch mehr aus beidem im selben Modellbaum.
#
# Headless (freecadcmd) gibt es keine Oberflaeche und damit keinen aktiven
# Arbeitsbereich; dort entscheidet der uebergebene Standard.
#
# Nutzung:
#   from bau_umgebung import aktiver_bereich, PART, PARTDESIGN
#   if aktiver_bereich() == PART: ...

PART = 'part'
PARTDESIGN = 'partdesign'

# Arbeitsbereichs-Namen, wie FreeCAD sie meldet (Gui.activeWorkbench().name()).
_BEREICHE = {
    'PartWorkbench': PART,
    'PartDesignWorkbench': PARTDESIGN,
}


def _workbench_name():
    """Name des aktiven Arbeitsbereichs — oder None ohne Oberflaeche."""
    try:
        import FreeCADGui as Gui
    except Exception:
        return None                      # headless: keine Oberflaeche
    try:
        wb = Gui.activeWorkbench()
    except Exception:
        return None                      # noch keiner geladen
    if wb is None:
        return None
    holen = getattr(wb, 'name', None)
    if callable(holen):
        try:
            return holen()
        except Exception:
            pass
    return wb.__class__.__name__


def aktiver_bereich(standard=PARTDESIGN):
    """PART oder PARTDESIGN — je nachdem, worin gerade gearbeitet wird.

    `standard` gilt, wenn sich das nicht feststellen laesst: headless, oder
    wenn ein dritter Arbeitsbereich aktiv ist (Skizzierer, Entwurf, Netz …).
    Dann waere jede Wahl geraten, und die bisherige Bauweise ist die
    verlaesslichere."""
    name = _workbench_name()
    if name is None:
        return standard
    return _BEREICHE.get(name, standard)


def bereich_name(bereich):
    """Anzeigename fuer Meldungen im Bericht-Fenster."""
    return "Part" if bereich == PART else "Part Design"


def entferne_objekt(doc, obj):
    """Entfernt ein Objekt samt allem, was daran haengt. Bei einem
    Part-Design-Body reicht removeObject NICHT: Features, Skizzen und der
    Ursprung blieben als Waisen im Dokument zurueck und der Baum fuellte
    sich bei jedem Bau weiter. Darum von innen nach aussen abraeumen."""
    namen = []
    if obj.isDerivedFrom('PartDesign::Body'):
        # Features in umgekehrter Baureihenfolge (Spitze zuerst), dann die
        # Skizzen darunter, dann der Ursprung mit seinen Ebenen und Achsen.
        for feat in reversed(list(getattr(obj, 'Group', []) or [])):
            namen.extend(_kinder_zuerst(feat))
        ursprung = getattr(obj, 'Origin', None)
        if ursprung is not None:
            for uf in list(getattr(ursprung, 'OriginFeatures', []) or []):
                namen.append(uf.Name)
            namen.append(ursprung.Name)
    namen.append(obj.Name)

    entfernt = []
    for name in namen:
        if doc.getObject(name) is None:
            continue
        try:
            doc.removeObject(name)
            entfernt.append(name)
        except Exception:
            pass            # haengt noch woanders dran -> stehen lassen
    return entfernt


def _kinder_zuerst(feat):
    """Feature-Name plus die Namen seiner Skizzen/Hilfsobjekte, Feature
    zuerst — ein Sketch laesst sich erst loeschen, wenn das Feature weg ist,
    das ihn benutzt."""
    namen = [feat.Name]
    for eigenschaft in ('Profile', 'Sketch', 'Base'):
        wert = getattr(feat, eigenschaft, None)
        if isinstance(wert, (tuple, list)) and wert:
            wert = wert[0]
        if hasattr(wert, 'Name'):
            namen.append(wert.Name)
    return namen
