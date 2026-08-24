# speichen_geometrie.py
# Kontur-Mathematik der Speichen-Durchbrueche im Steg zwischen Nabe und
# Zahnkranz. Bewusst OHNE FreeCAD-Import: dieselben Formeln liegen 1:1 in
# web/js/speichen.js, damit Live-Vorschau und CAD-Koerper identisch schneiden.
#
# Geliefert werden exakte Segmente (Linien und Kreisboegen) statt eines
# Polygonzugs — daraus wird im Generator ein sauberes Sketch mit wenigen
# Kanten (gut fuer STEP/CNC) statt hunderter Facetten.

import math

MIN_RING = 6.0        # ab dieser freien Ringbreite [mm] lohnen sich Speichen
MIN_OEFFNUNG = 3.0    # kleinste Bogenlaenge einer Oeffnung am Innenring [mm]
MIN_ARM = 2.0         # duennster zulaessiger Arm [mm]


# ── kleine Vektor-Helfer ──────────────────────────────────────────────────
def _add(a, b):  return (a[0] + b[0], a[1] + b[1])
def _sub(a, b):  return (a[0] - b[0], a[1] - b[1])
def _mul(a, k):  return (a[0] * k, a[1] * k)
def _dot(a, b):  return a[0] * b[0] + a[1] * b[1]
def _laenge(a):  return math.hypot(a[0], a[1])
def _pol(r, t):  return (r * math.cos(t), r * math.sin(t))
def _winkel(a):  return math.atan2(a[1], a[0])


def _kreis_kreis(c0, r0, c1, r1):
    """Schnittpunkte zweier Kreise (0, 1 oder 2 Punkte)."""
    d = _laenge(_sub(c1, c0))
    if d < 1e-9 or d > r0 + r1 or d < abs(r0 - r1):
        return []
    a = (r0 * r0 - r1 * r1 + d * d) / (2 * d)
    h2 = r0 * r0 - a * a
    if h2 < 0:
        return []
    h = math.sqrt(h2)
    e = _mul(_sub(c1, c0), 1.0 / d)                 # Einheitsvektor c0->c1
    m = _add(c0, _mul(e, a))
    n = (-e[1], e[0])
    return [_add(m, _mul(n, h)), _sub(m, _mul(n, h))]


def _naechster(punkte, ziel):
    """Der Kandidat mit dem kleinsten Abstand zu `ziel` (None bei leer)."""
    if not punkte:
        return None
    return min(punkte, key=lambda p: _laenge(_sub(p, ziel)))


def _bogen(mitte, radius, p0, p1):
    """Segment-Datensatz fuer einen Kreisbogen p0->p1 auf dem kurzen Weg.
    a0/a1 sind fuer FreeCAD gegen den Uhrzeigersinn sortiert; `ccw` haelt
    die tatsaechliche Durchlaufrichtung fuer die Vorschau fest."""
    a0 = _winkel(_sub(p0, mitte))
    a1 = _winkel(_sub(p1, mitte))
    delta = a1 - a0
    while delta > math.pi:
        delta -= 2 * math.pi
    while delta <= -math.pi:
        delta += 2 * math.pi
    ccw = delta > 0
    va, vb = (a0, a0 + delta) if ccw else (a0 + delta, a0)
    return {'typ': 'bogen', 'c': mitte, 'r': radius,
            'p0': p0, 'p1': p1, 'ccw': ccw, 'a0': va, 'a1': vb}


def _linie(p0, p1):
    return {'typ': 'linie', 'p0': p0, 'p1': p1}


# ── freier Ring zwischen Nabenkragen und Zahnkranz ────────────────────────
def ring_radien(r_kopf, p):
    """(r_innen, r_aussen) des Bereichs, in dem Speichen liegen duerfen.

    Massgeblich ist NICHT der Zahnfuss, sondern die Schmutzmulde: sie wird
    zur Stirnflaeche hin tiefer und endet dort weiter innen als am Mittelsteg.
    Erst unterhalb davon steht Material ueber die volle Breite."""
    breite = float(p['breite'])
    steg = float(p['steg_w'])
    r_fuss = r_kopf - float(p['tiefe'])
    mulden = (float(p['tasche_b']) > 0 and float(p['seiten_t']) > 0
              and 0 < steg < breite)
    if mulden:
        r_flach = r_kopf - float(p['seiten_t'])
        r_face = r_flach - (math.tan(math.radians(float(p['mulde_winkel'])))
                            * max(0.0, breite / 2.0 - steg / 2.0))
        grenze = min(r_fuss, r_face)
    else:
        grenze = r_fuss
    wand = float(p['speichen_wand'])          # gilt aussen (Kranz) wie innen (Nabe)
    r_aussen = grenze - wand
    r_innen = max(float(p['nabe_d']), float(p['bohrung_d'])) / 2.0 + wand
    return r_innen, r_aussen


def ist_sinnvoll(r_innen, r_aussen, anzahl, arm_b):
    """Automatik-Schwelle: zu schmaler Ring -> gar keine Speichen bauen."""
    if int(anzahl) < 3 or float(arm_b) < MIN_ARM:
        return False
    if r_aussen - r_innen < MIN_RING or r_innen <= arm_b / 2.0:
        return False
    offen = r_innen * (2 * math.pi / int(anzahl)
                       - 2 * math.asin(min(1.0, arm_b / (2 * r_innen))))
    return offen >= MIN_OEFFNUNG


# ── Arm-Mittellinie: Gerade (Schwung 0) oder Kreisbogen ───────────────────
def _arm(alpha, ri, ra, schwung):
    """Mittellinie eines Arms als ('linie', u, v) oder ('bogen', mitte, r)."""
    if abs(schwung) < 1e-4:
        return ('linie', _pol(1.0, alpha), _pol(1.0, alpha + math.pi / 2))
    p_i = _pol(ri, alpha)
    p_a = _pol(ra, alpha + schwung)
    p_m = _pol((ri + ra) / 2.0, alpha + schwung * 0.35)
    # Umkreismittelpunkt der drei Punkte
    ax, ay = p_i
    bx, by = p_m
    cx, cy = p_a
    d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
    if abs(d) < 1e-9:
        return ('linie', _pol(1.0, alpha), _pol(1.0, alpha + math.pi / 2))
    ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay)
          + (cx * cx + cy * cy) * (ay - by)) / d
    uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx)
          + (cx * cx + cy * cy) * (bx - ax)) / d
    mitte = (ux, uy)
    return ('bogen', mitte, _laenge(_sub(p_i, mitte)))


def _flanke(arm, seite, arm_b, ri, ra, schwung, alpha):
    """Begrenzung der Oeffnung an einem Arm.
    seite = +1: Oeffnung liegt im Uhrzeigersinn *nach* dem Arm (groesserer
    Polarwinkel), seite = -1: davor."""
    if arm[0] == 'linie':
        _, u, v = arm
        return ('linie', u, v, seite * arm_b / 2.0, seite)
    _, mitte, r = arm
    p_m = _pol((ri + ra) / 2.0, alpha + schwung * 0.35)
    e_t = (-p_m[1], p_m[0])
    e_t = _mul(e_t, 1.0 / (_laenge(e_t) or 1.0))            # tangential, +Winkel
    probe = _add(p_m, _mul(e_t, seite * arm_b / 2.0))
    aussen = 1 if _laenge(_sub(probe, mitte)) > r else -1    # Oeffnung ausserhalb?
    return ('bogen', mitte, r + aussen * arm_b / 2.0, aussen)


def _ecke(flanke, r_rand, rand_aussen, rc, referenz):
    """Verrundete Ecke zwischen Flanke und Randkreis (Radius r_rand um den
    Ursprung). rand_aussen=True: die Oeffnung liegt INNERHALB des Randkreises.
    `referenz` ist das zugehoerige Ende der Arm-Mittellinie — daran wird bei
    gebogenen Flanken die richtige der beiden Schnittloesungen erkannt.
    Liefert (punkt_auf_flanke, punkt_auf_rand, mittelpunkt_der_rundung)."""
    r_ziel = r_rand - rc if rand_aussen else r_rand + rc
    if flanke[0] == 'linie':
        _, u, v, d, s = flanke
        t_scharf = math.sqrt(max(r_rand * r_rand - d * d, 0.0))
        k = _add(_mul(u, t_scharf), _mul(v, d))          # Ecke ohne Rundung
        if rc <= 1e-6:
            return k, k, None
        dv = d + s * rc
        t2 = r_ziel * r_ziel - dv * dv
        if t2 <= 0:
            return k, k, None
        x = _add(_mul(u, math.sqrt(t2)), _mul(v, dv))    # Mittelpunkt der Rundung
        p_f = _add(_mul(u, _dot(x, u)), _mul(v, d))      # Lot auf die Flanke
    else:
        _, mitte, r_f, s = flanke
        k = _naechster(_kreis_kreis((0.0, 0.0), r_rand, mitte, r_f), referenz)
        if k is None:
            return None, None, None
        if rc <= 1e-6:
            return k, k, None
        x = _naechster(_kreis_kreis((0.0, 0.0), r_ziel, mitte, r_f + s * rc), k)
        if x is None:
            return k, k, None
        p_f = _add(mitte, _mul(_sub(x, mitte),
                               r_f / (_laenge(_sub(x, mitte)) or 1.0)))
    return p_f, _mul(x, r_rand / (_laenge(x) or 1.0)), x


def _flanken_segment(flanke, p0, p1):
    """Flankenstueck von p0 nach p1 — Linie oder konzentrischer Bogen."""
    if flanke[0] == 'linie':
        return _linie(p0, p1)
    return _bogen(flanke[1], flanke[2], p0, p1)


def kontur(anzahl, arm_b, r_innen, r_aussen, rundung, schwung_grad,
           rundung_nabe=None):
    """Alle Speichen-Oeffnungen im Ring r_innen..r_aussen.

    `rundung` verrundet die Ecken am Zahnkranz, `rundung_nabe` die an der Nabe
    (ohne Angabe derselbe Wert). Ein groesserer Nabenradius laesst die Arme
    tangential in den Nabenzylinder einlaufen, statt sie an einem Kragen
    abbrechen zu lassen — dort sitzt der Kraftfluss, und dort faellt eine
    scharfe Kerbe am meisten auf.

    Liefert {'oeffnungen': [[segment, ...], ...], 'schwung': ..., 'rundung':
    ..., 'rundung_nabe': ...} mit den TATSAECHLICH gebauten Werten. Passen
    Schwung oder Rundungen nicht in den vorhandenen Platz, werden sie
    schrittweise zurueckgenommen — wie die Radius-Kaskade der Verrundungen im
    Generator. Bleibt gar nichts Baubares uebrig, ist 'oeffnungen' leer und
    der Steg bleibt voll."""
    n = int(anzahl)
    leer = {'oeffnungen': [], 'schwung': 0.0, 'rundung': 0.0, 'rundung_nabe': 0.0}
    if not ist_sinnvoll(r_innen, r_aussen, n, arm_b):
        return leer
    teilung = 2 * math.pi / n

    # Beide Rundungen sitzen auf derselben Flanke und duerfen sie zusammen
    # nicht auffressen; passt die Summe nicht, werden beide im selben
    # Verhaeltnis gekuerzt (sonst verschoebe sich das gewollte Verhaeltnis).
    rd_a = max(float(rundung), 0.0)
    rd_i = max(float(rundung if rundung_nabe is None else rundung_nabe), 0.0)
    platz = max(r_aussen - r_innen - 0.3, 0.0)
    if rd_a + rd_i > platz > 0:
        f = platz / (rd_a + rd_i)
        rd_a, rd_i = rd_a * f, rd_i * f
    rd_a, rd_i = min(rd_a, float(arm_b)), min(rd_i, float(arm_b))

    for anteil in (1.0, 0.75, 0.5, 0.25, 0.0):
        schwung = math.radians(float(schwung_grad)) * anteil
        for stufe in (1.0, 0.6, 0.3, 0.0):
            rc_a, rc_i = rd_a * stufe, rd_i * stufe
            oeffnungen = _kontur_versuch(n, teilung, arm_b, r_innen, r_aussen,
                                         rc_a, rc_i, schwung)
            if oeffnungen and _plausibel(oeffnungen, r_innen, r_aussen):
                return {'oeffnungen': oeffnungen,
                        'schwung': math.degrees(schwung),
                        'rundung': rc_a, 'rundung_nabe': rc_i}
        if abs(schwung_grad) < 1e-4:
            break                      # radial: Schwung-Kaskade bringt nichts
    return leer


def _kontur_versuch(n, teilung, arm_b, r_innen, r_aussen, rc_a, rc_i,
                    schwung):
    """Ein Bauversuch mit festem Schwung und festen Verrundungen
    (rc_a am Zahnkranz, rc_i an der Nabe)."""
    oeffnungen = []
    for k in range(n):
        a0 = teilung * k
        a1 = a0 + teilung
        fa = _flanke(_arm(a0, r_innen, r_aussen, schwung), +1,
                     arm_b, r_innen, r_aussen, schwung, a0)
        fb = _flanke(_arm(a1, r_innen, r_aussen, schwung), -1,
                     arm_b, r_innen, r_aussen, schwung, a1)
        ecken = [_ecke(fa, r_aussen, True,  rc_a, _pol(r_aussen, a0 + schwung)),
                 _ecke(fb, r_aussen, True,  rc_a, _pol(r_aussen, a1 + schwung)),
                 _ecke(fb, r_innen,  False, rc_i, _pol(r_innen, a1)),
                 _ecke(fa, r_innen,  False, rc_i, _pol(r_innen, a0))]
        if any(e[0] is None for e in ecken):
            return []
        (a_out_f, a_out_r, a_out_m) = ecken[0]
        (b_out_f, b_out_r, b_out_m) = ecken[1]
        (b_in_f,  b_in_r,  b_in_m)  = ecken[2]
        (a_in_f,  a_in_r,  a_in_m)  = ecken[3]

        # Bleibt von der Flanke nichts mehr uebrig, ist die Rundung zu gross:
        # abbrechen und die Kaskade einen kleineren Radius probieren lassen
        # (eine entartete Null-Kante wuerde das Sketch unbrauchbar machen).
        if (_laenge(_sub(a_out_f, a_in_f)) < 0.05
                or _laenge(_sub(b_out_f, b_in_f)) < 0.05):
            return []

        seg = [_flanken_segment(fa, a_in_f, a_out_f)]          # Flanke A nach aussen
        if a_out_m:
            seg.append(_bogen(a_out_m, rc_a, a_out_f, a_out_r))
        seg.append(_bogen((0.0, 0.0), r_aussen, a_out_r, b_out_r))
        if b_out_m:
            seg.append(_bogen(b_out_m, rc_a, b_out_r, b_out_f))
        seg.append(_flanken_segment(fb, b_out_f, b_in_f))      # Flanke B nach innen
        if b_in_m:
            seg.append(_bogen(b_in_m, rc_i, b_in_f, b_in_r))
        seg.append(_bogen((0.0, 0.0), r_innen, b_in_r, a_in_r))
        if a_in_m:
            seg.append(_bogen(a_in_m, rc_i, a_in_r, a_in_f))
        oeffnungen.append(seg)
    return oeffnungen


def _plausibel(oeffnungen, r_innen, r_aussen):
    """Notbremse: Stuetzpunkte im Ring, Segmente luecklos aneinander und die
    Summe der Oeffnungen kleiner als der Ring — sonst lieber nicht schneiden."""
    ring = math.pi * (r_aussen ** 2 - r_innen ** 2)
    gesamt = flaeche(oeffnungen)
    if gesamt < 1.0 or gesamt > 0.95 * ring:
        return False
    for oef in oeffnungen:
        if flaeche([oef]) < 1.0:
            return False
    for oef in oeffnungen:
        for i, seg in enumerate(oef):
            folge = oef[(i + 1) % len(oef)]
            if _laenge(_sub(seg['p1'], folge['p0'])) > 0.02:
                return False
            for p in (seg['p0'], seg['p1']):
                r = _laenge(p)
                if r < r_innen - 0.02 or r > r_aussen + 0.02:
                    return False
    return True


def flaeche(oeffnungen, punkte_je_bogen=24):
    """Naeherungsweise Gesamtflaeche aller Oeffnungen [mm²] — fuer Ausgaben
    und Tests; die Kontur selbst bleibt exakt."""
    gesamt = 0.0
    for oef in oeffnungen:
        pts = []
        for seg in oef:
            if seg['typ'] == 'linie':
                pts.append(seg['p0'])
                continue
            a0, a1 = seg['a0'], seg['a1']
            if not seg['ccw']:
                a0, a1 = a1, a0
            for i in range(punkte_je_bogen):
                t = a0 + (a1 - a0) * i / punkte_je_bogen
                pts.append(_add(seg['c'], _pol(seg['r'], t)))
        s = 0.0
        for i, p in enumerate(pts):
            q = pts[(i + 1) % len(pts)]
            s += p[0] * q[1] - q[0] * p[1]
        gesamt += abs(s) / 2.0
    return gesamt
