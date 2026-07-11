# generator.py
# Erzeugt die Zahnrad-Geometrie im FreeCAD-Sketch

import os
import json
import math
import FreeCAD as App
import FreeCADGui as Gui
import Part


class ZahnradVollGenerator:

    def setup_environment(self):
        """Stellt sicher, dass ein Dokument, ein Body und ein Sketch vorhanden sind."""
        doc = App.ActiveDocument or App.newDocument("ZahnradDokument")

        bodies = doc.findObjects(Type='PartDesign::Body')
        active_body = (
            bodies[0] if bodies
            else doc.addObject('PartDesign::Body', 'ZahnradKoerper')
        )
        self.body = active_body
        if App.GuiUp:
            Gui.ActiveDocument.ActiveView.setActiveObject('pd_body', active_body)

        sketch = next(
            (obj for obj in active_body.Group if obj.Label == 'ZahnradSketch'),
            None
        )
        if not sketch:
            sketch = doc.addObject('Sketcher::SketchObject', 'ZahnradSketch')
            active_body.addObject(sketch)

        return sketch

    def generate_gear(self, params):
        """Berechnet und zeichnet das Zahnprofil anhand der übergebenen Parameter."""
        try:
            self.sketch = self.setup_environment()
            self.sketch.deleteAllGeometry()

            z      = int(params['zaehne'])
            alpha  = math.radians(params['eingriffswinkel'])
            s_mt   = params['spitzen_abstand']
            r_s    = params['spitzen_d'] / 2.0
            r_f    = params['fuss_d'] / 2.0
            tiefe  = params['tiefe']
            # 'rotation'/'z_offset' sind veraltete Felder — falls nicht mehr
            # vorhanden, mit 0 rechnen (Standardorientierung, planares Profil).
            rot    = math.radians(params.get('rotation', 0.0))
            z_off  = params.get('z_offset', 0.0)

            # Radiale Abstände
            r_bahn     = s_mt / (2 * math.sin(math.pi / z))
            r_kopf_max = r_bahn + r_s
            r_fuss_min = r_kopf_max - tiefe
            r_fuss_bahn = r_fuss_min + r_f

            # Für den Körper-Aufbau merken
            self.r_kopf_max = r_kopf_max
            self.r_fuss_min = r_fuss_min

            # Hilfskreise (als Konstruktionsgeometrie)
            self._add_construction_circles(r_kopf_max, r_fuss_min, r_bahn)

            # Zahnprofile
            for i in range(z):
                self._add_tooth(i, z, alpha, rot, z_off,
                                r_bahn, r_kopf_max, r_fuss_bahn, r_s, r_f)

            App.ActiveDocument.recompute()

        except Exception as e:
            print(f"Fehler bei der Zahnrad-Generierung: {e}")

    # ------------------------------------------------------------------
    # Interne Hilfsmethoden
    # ------------------------------------------------------------------

    def _add_construction_circles(self, r_kopf, r_fuss, r_bahn):
        """Zeichnet die drei Hilfskreise als Konstruktionslinien."""
        origin = App.Vector(0, 0, 0)
        normal = App.Vector(0, 0, 1)
        for r in (r_kopf, r_fuss, r_bahn):
            self.sketch.addGeometry(
                Part.Circle(origin, normal, r), True   # True = Konstruktionsgeometrie
            )

    def _add_tooth(self, i, z, alpha, rot, z_off,
                   r_bahn, r_kopf_max, r_fuss_bahn, r_s, r_f):
        """Zeichnet einen einzelnen Zahn (Arc + Linie + Arc + Linie)."""
        w_zahn = 2 * math.pi * i / z + rot
        w_fuss = 2 * math.pi * (i + 0.5) / z + rot
        w_next = 2 * math.pi * (i + 1) / z + rot

        cp_s      = App.Vector(r_bahn * math.cos(w_zahn), r_bahn * math.sin(w_zahn), z_off)
        cp_s_next = App.Vector(r_bahn * math.cos(w_next), r_bahn * math.sin(w_next), z_off)
        cp_f      = App.Vector(r_fuss_bahn * math.cos(w_fuss), r_fuss_bahn * math.sin(w_fuss), z_off)

        off = alpha * 0.5
        HALF_PI = math.pi / 2

        p_zahn_r     = cp_s      + App.Vector(r_s * math.cos(w_zahn + HALF_PI - off),
                                               r_s * math.sin(w_zahn + HALF_PI - off), 0)
        p_fuss_l     = cp_f      + App.Vector(r_f * math.cos(w_fuss - HALF_PI - off),
                                               r_f * math.sin(w_fuss - HALF_PI - off), 0)
        p_fuss_r     = cp_f      + App.Vector(r_f * math.cos(w_fuss + HALF_PI + off),
                                               r_f * math.sin(w_fuss + HALF_PI + off), 0)
        p_zahn_next_l = cp_s_next + App.Vector(r_s * math.cos(w_next - HALF_PI + off),
                                                r_s * math.sin(w_next - HALF_PI + off), 0)

        normal = App.Vector(0, 0, 1)

        # Zahnkopf-Arc
        self.sketch.addGeometry(
            Part.ArcOfCircle(
                Part.Circle(cp_s, normal, r_s),
                w_zahn - HALF_PI + off,
                w_zahn + HALF_PI - off
            ), False
        )
        # Flanke rechts → Fußrunden-Mittelpunkt links
        self.sketch.addGeometry(Part.LineSegment(p_zahn_r, p_fuss_l), False)

        # Fußrunden-Arc
        self.sketch.addGeometry(
            Part.ArcOfCircle(
                Part.Circle(cp_f, normal, r_f),
                w_fuss + HALF_PI + off,
                w_fuss + HALF_PI + math.pi - off
            ), False
        )
        # Flanke links → nächster Zahnkopf
        self.sketch.addGeometry(Part.LineSegment(p_fuss_r, p_zahn_next_l), False)

    # ==================================================================
    # Volumenkörper-Aufbau  ("Körper erzeugen")
    # ==================================================================

    # Feste Namen der vom Körper-Aufbau erzeugten Objekte (idempotentes Neu-Erzeugen).
    # Die Schmutzabweiser-Taschen (Präfix 'Schmutz') werden zusätzlich per
    # Namenspräfix entfernt, da ihre Anzahl von der Zähnezahl abhängt.
    _SOLID_OBJECTS = [
        'ZahnVerrundung',
        'MuldenFillet',
        'ZahnPad',
        'FuehrungRingPad', 'FuehrungRingSketch',
        'NabePad', 'NabeSketch',
        'LagerObenPocket', 'LagerUntenPocket',
        'LagerObenSketch', 'LagerUntenSketch',
        'LagerObenDatum', 'LagerUntenDatum',
        'Bohrung', 'BohrungSketch',
        # Alt-Namen früherer Generator-Versionen: in lange lebenden Dokumenten
        # können solche Zombie-Features hängen bleiben und Fillets stören.
        'StegFillet',
        'FuehrungObenPad', 'FuehrungUntenPad',
        'FuehrungObenSketch', 'FuehrungUntenSketch',
        'FuehrungObenDatum', 'FuehrungUntenDatum',
        'AussparungObenPocket', 'AussparungUntenPocket',
        'AussparungObenSketch', 'AussparungUntenSketch',
        'AussparungObenDatum', 'AussparungUntenDatum',
    ]
    _SOLID_PREFIXES = ('Schmutz',)

    # Merkt sich je Geometrie den zuletzt erfolgreich gebauten Fillet-Radius,
    # damit Wiederhol-Builds die teuren OCC-Fehlversuche überspringen.
    _CACHE_DATEI = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "zahnrad_cache.json")

    def _cache_lesen(self):
        try:
            with open(self._CACHE_DATEI, encoding="utf-8") as f:
                daten = json.load(f)
            return daten if isinstance(daten, dict) else {}
        except Exception:
            return {}

    def _cache_merken(self, schluessel, eintrag):
        daten = self._cache_lesen()
        daten[schluessel] = eintrag
        try:
            with open(self._CACHE_DATEI, "w", encoding="utf-8") as f:
                json.dump(daten, f, indent=2)
        except Exception:
            pass

    def _cache_startradius(self, schluessel, wunsch):
        """Liefert den Startradius für die Kaskade: der zuletzt für dieselbe
        Geometrie + denselben Wunschradius erfolgreiche Wert (sonst wunsch)."""
        e = self._cache_lesen().get(schluessel, {})
        if (e.get('fp') == getattr(self, '_geo_fp', None)
                and e.get('wunsch') == wunsch and e.get('ok')):
            return min(wunsch, float(e['ok']))
        return wunsch

    def build_solid(self, params):
        """Baut aus dem Zahnprofil einen fertigen Gates-CDX-Volumenkörper:
        Pad (Zahnkörper) + polar wiederholte Schmutzabweiser-Taschen mit
        stehendem Mittelsteg (Riemenführung) + zentrale Bohrung."""
        try:
            # 0. Kurzschluss: unveränderte Parameter und der Körper existiert
            #    noch gültig -> nichts zu tun (spart den kompletten Neuaufbau,
            #    z.B. bei versehentlichem Doppelklick).
            if getattr(self, '_letzte_params', None) == params:
                try:
                    if (self.body.Document is App.ActiveDocument
                            and self.body.Shape.isValid()
                            and self.body.Shape.Volume > 0):
                        print("Zahnrad: Parameter unverändert — Körper ist aktuell.")
                        return self.body
                except Exception:
                    pass    # Body/Dokument weg -> normal neu bauen

            # 1. ERST alte Körper-Features entfernen, DANN das Sketch neu
            #    zeichnen — sonst recomputed generate_gear() beim Sketch-Update
            #    den kompletten alten Feature-Baum mit (macht Wiederhol-Builds
            #    um ein Vielfaches langsamer).
            self.setup_environment()
            doc  = App.ActiveDocument
            body = self.body
            self._remove_solid_objects(doc)

            # 2. Sketch neu erzeugen (setzt self.sketch)
            self.generate_gear(params)

            z         = int(params['zaehne'])
            breite    = params['breite']
            bohrung_d = params['bohrung_d']
            nabe_d    = params.get('nabe_d', 0.0)  # Kugellager-Nabe Außen-Ø
            nabe_l    = params.get('nabe_l', 0.0)  # Länge der Nabe
            lager_d   = params.get('lager_d', 0.0) # Ø der Flansch-Senkung (beide Enden)
            lager_t   = params.get('lager_t', 0.0) # Tiefe der Flansch-Senkung je Seite
            steg_w    = params['steg_w']           # Breite des stehenden Mittelstegs (Muldenabstand)
            fuehr_w   = params['fuehrung_w']       # axiale Dicke des Führungsrings
            fuehr_d   = params['fuehrung_d']       # Außen-Ø des Führungsrings (0 = auto)
            seiten_t  = params['seiten_t']         # radiale Tiefe der Mulde (außen)
            tasche_b  = params['tasche_b']         # tangentiale Breite je Tasche
            m_winkel  = params['mulde_winkel']     # Neigung der Muldenflanke [Grad]
            m_rund    = params['mulde_r']          # Verrundungsradius der Mulde [mm]
            zahn_r    = params.get('zahn_r', 0.0)  # Verrundung der Zahnkontur beidseitig
            rundungen = params.get('rundungen', True)  # False = Entwurfsmodus (schnell)

            # Geometrie-Fingerabdruck für den Radius-Cache: nur Werte, die die
            # Fillet-Machbarkeit beeinflussen. Ändert sich einer, wird der
            # gecachte Radius verworfen und wieder ab Wunschradius probiert.
            self._geo_fp = repr([round(float(params.get(k, 0)), 3) for k in (
                'zaehne', 'eingriffswinkel', 'spitzen_abstand', 'spitzen_d',
                'fuss_d', 'tiefe', 'breite', 'steg_w', 'seiten_t',
                'tasche_b', 'mulde_winkel', 'mulde_r',
                'bohrung_d', 'nabe_d', 'nabe_l', 'lager_d', 'lager_t',
                'fuehrung_w', 'fuehrung_d')])

            # 3. Zahnkörper aufpolstern (symmetrisch zur XY-Ebene)
            #    Hinweis: KEIN recompute je Feature — sonst verschachteln sich
            #    ~20 Dokument-Recomputes ("Recursive calling of recompute").
            #    Alle Features werden aufgebaut, EIN recompute erfolgt am Ende.
            pad = body.newObject('PartDesign::Pad', 'ZahnPad')
            pad.Profile  = self.sketch
            pad.Length   = breite
            pad.SideType = 'Symmetric'
            self.sketch.Visibility = False

            # 4. Schmutzabweiser: eine keilförmige Tasche (oben+unten, Mittelsteg
            #    der Breite steg_w bleibt stehen), tangential in jede Zahnlücke.
            if steg_w > 0 and seiten_t > 0 and tasche_b > 0 and steg_w < breite:
                self._add_schmutztaschen(doc, body, z, breite, steg_w, seiten_t,
                                         tasche_b, m_winkel,
                                         params.get('rotation', 0.0))

            # 4b. Winkelflächen-Seitenkanten der Mulden verrunden — wie im
            #     Original VOR der Stirnflächen-Verrundung (sonst ungültig).
            #     Die Rundungen sind der teuerste Teil des Baus (>80 % der Zeit);
            #     im Entwurfsmodus (rundungen=False) werden sie übersprungen.
            if rundungen and m_rund > 0 and steg_w > 0 and seiten_t > 0 and tasche_b > 0:
                print("Zahnrad: Mulden-Verrundung … (dauert am längsten)")
                self._add_flanken_fillet(doc, body, m_rund)

            # 5. Mittlere Riemenführung: erhabenes z-Eck (eine Ecke je Zahn,
            #    Ecken auf den Zähnen, Flachseiten über den Lücken — wie in der
            #    Vorlage), steht in den Zahnlücken über den Zahnfuß hinaus.
            #    Schmaler als der Steg -> gewollter Steg-Überstand je Seite.
            if fuehr_w > 0:
                r_guide = (fuehr_d / 2.0) if fuehr_d > 0 else (self.r_kopf_max - 1.1)
                self._add_fuehrungsring(doc, body, r_guide, fuehr_w, z,
                                        params.get('rotation', 0.0))

            # 6. Kugellager-Nabe: additiver Boss um die Bohrung (Sitz fürs
            #    Flansch-Kugellager, steht ggf. über die Flanken hinaus).
            if nabe_d > bohrung_d and nabe_l > 0:
                self._add_nabe(doc, body, nabe_d / 2.0, nabe_l)

            # 7. Zentrale Bohrung (durch alles, inkl. Nabe)
            if bohrung_d > 0:
                self._add_bore(doc, body, bohrung_d / 2.0)

            # 8. Flansch-Lagersitz: Ø-Senkung an BEIDEN Nabenenden (Sitz für den
            #    Lagerflansch). Nur sinnvoll, wenn größer als die Bohrung.
            if (nabe_d > 0 and nabe_l > 0 and lager_d > bohrung_d and lager_t > 0):
                self._add_lagersitz(doc, body, lager_d / 2.0, lager_t, nabe_l / 2.0)

            # 9. Zahnkontur + Muldenöffnungen an beiden Stirnseiten verrunden —
            #    als LETZTES Feature auf dem fertigen Körper, die zentrale
            #    Nabenkante ausgenommen. (Methode nach dem bewährten User-Makro
            #    'flächen abrundung.py' — erlaubt größere Radien als der
            #    Ganze-Flächen-Fillet mitten im Baum.)
            if rundungen and zahn_r > 0:
                print("Zahnrad: Zahn-Rundung …")
                self._add_zahn_verrundung(doc, body, breite, zahn_r)

            doc.recompute()
            if App.GuiUp:
                body.Visibility = True
            self._letzte_params = dict(params)   # für den Kurzschluss oben
            return body

        except Exception as e:
            import traceback
            print(f"Fehler beim Körper-Aufbau: {e}")
            traceback.print_exc()
            return None

    def make_fertigteil(self, params):
        """Baut den Körper (falls nötig) und legt eine einfache Kopie
        'RitzelFertig' an: ein einzelnes Objekt ohne Feature-Baum — ideal für
        Export oder Weiterverwendung. Der Body wird ausgeblendet."""
        body = self.build_solid(params)
        if body is None:
            return None
        doc = App.ActiveDocument
        alt = doc.getObject('RitzelFertig')
        if alt is not None:
            doc.removeObject(alt.Name)
        kopie = doc.addObject('Part::Feature', 'RitzelFertig')
        kopie.Shape = body.Shape.copy()
        if App.GuiUp:
            body.Visibility = False
            kopie.Visibility = True
        doc.recompute()
        print("Fertigteil 'RitzelFertig' erzeugt — ein Einzelkörper ohne Baum.")
        return kopie

    # ------------------------------------------------------------------

    def _remove_solid_objects(self, doc):
        """Löscht zuvor erzeugte Körper-Features in Abhängigkeitsreihenfolge."""
        # Präfix-Objekte (Schmutztaschen) zuerst: Pockets vor ihren Sketches.
        prefixed = [o for o in doc.Objects
                    if o.Name.startswith(self._SOLID_PREFIXES)]
        for o in sorted(prefixed, key=lambda o: 'Sketch' in o.Name):
            try:
                doc.removeObject(o.Name)
            except Exception:
                pass
        for name in self._SOLID_OBJECTS:      # Features vor ihren Sketches
            obj = doc.getObject(name)
            if obj is not None:
                doc.removeObject(obj.Name)

    def _origin_feature(self, body, role):
        """Liefert ein Origin-Feature des Bodys (z.B. 'XY_Plane', 'Z_Axis')."""
        for feat in body.Origin.OriginFeatures:
            if getattr(feat, 'Role', '') == role:
                return feat
        return None

    def _xy_plane(self, body):
        return self._origin_feature(body, 'XY_Plane')

    def _add_schmutztaschen(self, doc, body, z, breite, steg_w, seiten_t,
                            tasche_b, mulde_winkel, rotation):
        """Schneidet in jede Zahnlücke eine keilförmige Schmutzabweiser-Mulde
        in den Zahnkranz — oben und unten, sodass in der Mitte ein Steg der
        Breite steg_w stehen bleibt.

        Umgesetzt als Schleife aus z Einzel-Pockets (PartDesign::PolarPattern
        arbeitet headless unzuverlässig). Jede Skizze liegt in einer um die
        Z-Achse gedrehten Radialebene (lokal u = radial, v = axial). Die Mulden
        sitzen bei den Zahnlücken (Winkel (i+0.5)·360/z), NICHT auf den Zähnen.
        seiten_t = radiale Muldentiefe AM STEG (Drehpunkt der Flanke).
        mulde_winkel [Grad] dreht die Flanke an der Steg-Kante: 0 = gerade
        (gleiche Tiefe überall), >0 = zur Stirnseite hin tiefer werdend."""
        r_kopf  = self.r_kopf_max
        r_out   = r_kopf + 1.0                # sicher über den Kopfkreis
        w2      = steg_w / 2.0                # halbe Stegbreite (Muldenabstand)
        b2      = breite / 2.0 + 1.0          # sicher durch die Stirnfläche
        r_flach = r_kopf - seiten_t           # Tiefe am Steg (fest, Drehpunkt)
        r_flach = min(r_flach, r_out - 0.2)   # nicht über den Außenrand hinaus
        # Flanke dreht an der Steg-Kante: von (r_flach, w2) nach (r_tief, b2),
        # tan(Winkel) = Δr / Δz — nach außen (Stirnseite) wird es tiefer
        r_tief  = r_flach - math.tan(math.radians(mulde_winkel)) * (b2 - w2)
        r_tief  = max(r_tief, 0.5)            # nie durch die Achse schneiden
        # Muldenmaße für die spätere Flanken-Verrundung merken
        self._mulde_r_flach = r_flach
        self._mulde_r_tief  = r_tief
        self._mulde_w2 = w2
        self._mulde_breite = breite

        # Basisdrehung: lokale Skizzen-Achsen (u,v) -> global (X, Z)
        base_rot = App.Rotation(App.Vector(1, 0, 0), 90)

        for i in range(z):
            # Zahnlücke i liegt bei (i+0.5)·360/z (+ Rotation) — genau zwischen
            # zwei Zähnen, damit die Mulde die Zähne nicht anschneidet.
            theta = 360.0 * (i + 0.5) / z + rotation
            sk = body.newObject('Sketcher::SketchObject', f'Schmutz{i:02d}Sketch')
            sk.MapMode = 'Deactivated'
            sk.Placement = App.Placement(
                App.Vector(0, 0, 0),
                App.Rotation(App.Vector(0, 0, 1), theta).multiply(base_rot))

            for vz in (1, -1):                # Keil-Trapez oben (+1) und unten (-1)
                p1 = App.Vector(r_out,   vz * w2, 0)   # außen, nahe Steg
                p2 = App.Vector(r_out,   vz * b2, 0)   # außen, an der Stirnseite
                p3 = App.Vector(r_tief,  vz * b2, 0)   # tief, an der Stirnseite
                p4 = App.Vector(r_flach, vz * w2, 0)   # flach, nahe Steg
                for a, b in ((p1, p2), (p2, p3), (p3, p4), (p4, p1)):
                    sk.addGeometry(Part.LineSegment(a, b), False)

            pocket = body.newObject('PartDesign::Pocket', f'Schmutz{i:02d}Pocket')
            pocket.Profile  = sk
            pocket.Length   = tasche_b
            pocket.SideType = 'Symmetric'     # tangential nach beiden Seiten
            sk.Visibility = False

    @staticmethod
    def _ist_zentrale_kreiskante(edge):
        """True für die geschlossene Kreiskante um die Achse (Nabendurchdringung
        bzw. Bohrung) — sie wird von der Zahn-Rundung ausgenommen."""
        if edge.Closed and hasattr(edge.Curve, 'Radius'):
            c = edge.CenterOfMass
            return math.hypot(c.x, c.y) < 1.0
        return False

    def _add_zahn_verrundung(self, doc, body, breite, radius):
        """Verrundet die Kanten der beiden Stirnflächen (Zahnkontur UND
        Muldenöffnungen) — als LETZTES Feature auf dem fertigen Körper, die
        zentrale Kreiskante (Nabe/Bohrung) ausgenommen. Methode nach dem
        bewährten User-Makro 'flächen abrundung.py': die explizite Kantenliste
        mit Zentral-Ausschluss verkraftet größere Radien als ein
        Ganze-Flächen-Fillet mitten im Feature-Baum.
        Robuster Fallback: schlägt der Fillet fehl, wird er entfernt."""
        doc.recompute()                        # fertiger Körper muss da sein
        tip = body.Tip
        sh = tip.Shape
        zmax = breite / 2.0
        names = []
        for ziel in (zmax, -zmax):
            # größte planare Stirnfläche bei z=±breite/2 finden
            best = None
            for idx, f in enumerate(sh.Faces):
                su = f.Surface
                if su.__class__.__name__ != 'Plane' or abs(su.Axis.z) < 0.99:
                    continue
                if abs(f.BoundBox.ZMin - ziel) < 0.2:   # planar -> ZMin==ZMax
                    if best is None or f.Area > best[0]:
                        best = (f.Area, idx)
            if best is None:
                continue
            # deren Kanten einzeln übernehmen — ohne die zentrale Kreiskante
            face = sh.Faces[best[1]]
            for fe in face.Edges:
                if self._ist_zentrale_kreiskante(fe):
                    continue
                for i, oe in enumerate(sh.Edges):
                    if fe.isSame(oe):
                        name = f'Edge{i + 1}'
                        if name not in names:
                            names.append(name)
                        break
        if not names:
            return
        # Radius-Kaskade wie bei der Mulden-Verrundung: zu großer Radius wird
        # schrittweise reduziert statt die Rundung ganz wegzulassen.
        prev_tip = body.Tip
        fil = body.newObject('PartDesign::Fillet', 'ZahnVerrundung')
        fil.Base = (tip, names)
        r = self._cache_startradius('zahn_r', radius)
        while r >= 0.1:
            try:
                fil.Radius = r
                doc.recompute()
                if body.Shape.isValid() and 'Invalid' not in ' '.join(fil.State):
                    if r < radius:
                        print(f"Zahn-Rundung: Radius {radius} zu groß für diese "
                              f"Geometrie — mit {r:.2f} angewendet.")
                    self._cache_merken('zahn_r', {
                        'fp': self._geo_fp, 'wunsch': radius, 'ok': r})
                    return
            except Exception:
                pass
            # große Radien schnell halbieren, kleine in 0,1er-Schritten absteigen.
            # OCC-Fillets sind nicht monoton (0,4 baut, wo 0,5 fehlschlägt) —
            # grobe Schritte würden machbare Radien überspringen.
            r = round(r / 2.0, 2) if r > 1.2 else round(r - 0.1, 2)
        print(f"Zahn-Rundung übersprungen (kein gültiger Radius ≤ {radius}).")
        doc.removeObject(fil.Name)
        body.Tip = prev_tip
        doc.recompute()

    def _add_flanken_fillet(self, doc, body, radius):
        """Verrundet die schrägen SEITENkanten der Winkelfläche (Muldenboden) —
        genau wie im Original-Ritzel (dort Fillet R1,5). Das sind die 4 Kanten je
        Mulde (links/rechts der oberen und unteren Winkelfläche), die entlang der
        Schräge laufen: Line-Kanten mit axialer+radialer Richtung (NICHT tangential)
        im Flankenbereich (r zwischen r_flach und r_tief, |z| zwischen Steg und
        Stirnfläche). Robuster Fallback: schlägt der Fillet fehl, wird er entfernt."""
        r_flach = getattr(self, '_mulde_r_flach', None)
        r_tief  = getattr(self, '_mulde_r_tief', None)
        w2      = getattr(self, '_mulde_w2', None)
        breite  = getattr(self, '_mulde_breite', None)
        if None in (r_flach, r_tief, w2, breite):
            return
        doc.recompute()                        # Kanten müssen berechnet sein
        tip = body.Tip                         # letztes Feature = aktueller Körper
        shape = tip.Shape
        # Radius-Band über die GANZE Flanke (r_tief..r_flach) mit Toleranz.
        # (Vorher war das Band [r_flach-2, r_tief+2] — das wird bei steilem
        # Mulden-Winkel schmal und verfehlt die Kanten, deren Mittelpunkt
        # genau auf der Grenze liegt.)
        r_lo = min(r_flach, r_tief) - 0.5
        r_hi = max(r_flach, r_tief) + 0.5
        names = []
        for idx, e in enumerate(shape.Edges):
            if e.Curve.__class__.__name__ != 'Line':
                continue
            m = (e.FirstParameter + e.LastParameter) / 2.0
            mp = e.valueAt(m); d = e.tangentAt(m)
            r = math.hypot(mp.x, mp.y); z = mp.z
            rv = App.Vector(mp.x, mp.y, 0)
            if rv.Length < 1e-6:
                continue
            rv.normalize()
            tang = abs(App.Vector(-rv.y, rv.x, 0).dot(App.Vector(d.x, d.y, 0)))
            # schräge Flankenkante: axial dominant, kaum tangential, mittige Höhe
            if (abs(d.z) > 0.5 and tang < 0.3
                    and r_lo < r < r_hi
                    and w2 + 0.3 < abs(z) < breite / 2.0 + 0.3):
                names.append(f'Edge{idx + 1}')
        if not names:
            print("Mulden-Verrundung: keine Flankenkanten gefunden — übersprungen.")
            return
        # Radius-Kaskade: ist der Wunschradius für die Geometrie zu groß
        # (OCC-Fillet ungültig), schrittweise verkleinern statt aufgeben.
        # Startet beim zuletzt erfolgreichen Radius (Cache) — fehlschlagende
        # OCC-Fillets sind sehr langsam, das spart bei Wiederhol-Builds viel Zeit.
        prev_tip = body.Tip
        fil = body.newObject('PartDesign::Fillet', 'MuldenFillet')
        fil.Base = (tip, names)
        r = self._cache_startradius('mulde_r', radius)
        while r >= 0.2:
            try:
                fil.Radius = r
                doc.recompute()
                if body.Shape.isValid() and 'Invalid' not in ' '.join(fil.State):
                    if r < radius:
                        print(f"Mulden-Verrundung: Radius {radius} zu groß für "
                              f"diese Geometrie — mit {r:.2f} angewendet.")
                    self._cache_merken('mulde_r', {
                        'fp': self._geo_fp, 'wunsch': radius, 'ok': r})
                    return
            except Exception:
                pass
            r = round(r - 0.25, 2)
        print(f"Mulden-Verrundung übersprungen (kein gültiger Radius ≤ {radius}).")
        doc.removeObject(fil.Name)
        body.Tip = prev_tip
        doc.recompute()

    def _add_fuehrungsring(self, doc, body, r_guide, ring_w, z, rotation):
        """Additive Riemenführung im Zentrum (Z=0), Dicke ring_w: ein
        regelmäßiges z-Eck mit Eckenradius r_guide. Die Ecken liegen auf den
        Zähnen (Winkel i·360/z + Rotation), die flachen Seiten über den
        Zahnlücken — wie das Vorlagenteil Riemenfuehrung_Mitte."""
        xy = self._xy_plane(body)
        sk = body.newObject('Sketcher::SketchObject', 'FuehrungRingSketch')
        sk.AttachmentSupport = [(xy, '')]
        sk.MapMode = 'FlatFace'
        pts = []
        for i in range(z):
            w = math.radians(360.0 * i / z + rotation)
            pts.append(App.Vector(r_guide * math.cos(w),
                                  r_guide * math.sin(w), 0))
        for a, b in zip(pts, pts[1:] + pts[:1]):
            sk.addGeometry(Part.LineSegment(a, b), False)

        pad = body.newObject('PartDesign::Pad', 'FuehrungRingPad')
        pad.Profile  = sk
        pad.Length   = ring_w
        pad.SideType = 'Symmetric'     # mittig um Z=0
        sk.Visibility = False

    def _add_nabe(self, doc, body, r_nabe, laenge):
        """Additive Nabe (Zylinder-Boss, Z=0 symmetrisch) als Sitz für das
        Kugellager. Die zentrale Bohrung wird anschließend hindurchgeführt."""
        xy = self._xy_plane(body)
        sk = body.newObject('Sketcher::SketchObject', 'NabeSketch')
        sk.AttachmentSupport = [(xy, '')]
        sk.MapMode = 'FlatFace'
        sk.addGeometry(
            Part.Circle(App.Vector(0, 0, 0), App.Vector(0, 0, 1), r_nabe), False)

        pad = body.newObject('PartDesign::Pad', 'NabePad')
        pad.Profile  = sk
        pad.Length   = laenge
        pad.SideType = 'Symmetric'     # mittig um Z=0
        sk.Visibility = False

    def _add_lagersitz(self, doc, body, r_lager, tiefe, z_face):
        """Senkung Ø=2·r_lager, Tiefe `tiefe`, an BEIDEN Nabenstirnseiten
        (bei z=+z_face und z=−z_face) — Sitz für den Kugellager-Flansch.
        Die zentrale Bohrung ist bereits durch; die Senkung erweitert nur
        den äußeren 1-mm-Bereich je Seite auf den Flansch-Ø."""
        xy = self._xy_plane(body)
        for tag, zf, rev in (('Oben', z_face, False), ('Unten', -z_face, True)):
            datum = body.newObject('PartDesign::Plane', f'Lager{tag}Datum')
            datum.AttachmentSupport = [(xy, '')]
            datum.MapMode = 'FlatFace'
            datum.AttachmentOffset = App.Placement(
                App.Vector(0, 0, zf), App.Rotation())
            datum.Visibility = False

            sk = body.newObject('Sketcher::SketchObject', f'Lager{tag}Sketch')
            sk.AttachmentSupport = [(datum, '')]
            sk.MapMode = 'FlatFace'
            sk.addGeometry(
                Part.Circle(App.Vector(0, 0, 0), App.Vector(0, 0, 1), r_lager), False)

            poc = body.newObject('PartDesign::Pocket', f'Lager{tag}Pocket')
            poc.Profile  = sk
            poc.Length   = tiefe
            poc.Reversed = rev        # ins Material hinein (zur Mitte)
            sk.Visibility = False

    def _add_bore(self, doc, body, radius):
        """Zentrale Bohrung als Pocket 'ThroughAll' (beidseitig)."""
        xy = self._xy_plane(body)

        sk = body.newObject('Sketcher::SketchObject', 'BohrungSketch')
        sk.AttachmentSupport = [(xy, '')]
        sk.MapMode = 'FlatFace'
        sk.addGeometry(
            Part.Circle(App.Vector(0, 0, 0), App.Vector(0, 0, 1), radius), False)

        pocket = body.newObject('PartDesign::Pocket', 'Bohrung')
        pocket.Profile  = sk
        pocket.Type     = 'ThroughAll'
        pocket.SideType = 'Symmetric'
        sk.Visibility = False
