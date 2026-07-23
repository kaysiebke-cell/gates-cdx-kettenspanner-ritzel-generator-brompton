# params.py
# Standardwerte und Felddefinitionen für den Zahnrad-Konfigurator

# Harte Zähnezahl-Grenzen (identisch zur Web-Version: fields.js ZAEHNE_MIN/MAX)
ZAEHNE_MIN = 12
ZAEHNE_MAX = 18

# Eingabefelder in drei thematische Abschnitte gegliedert.
# Format je Abschnitt: (Überschrift, [ (key, label, default), ... ])
FIELD_SECTIONS = [
    ("Zahnrad-Körper (Grundkörper)", [
        ("zaehne",          "Zähne",          14),     # Zähnezahl
        ("eingriffswinkel", "Winkel (°)",     20.0),   # Eingriffswinkel
        ("spitzen_abstand", "Mitte-Mitte",    10.20),  # Zahnmittenabstand
        ("spitzen_d",       "Kopf Ø",          2.80),  # Kopfrundungs-Ø
        ("fuss_d",          "Fuß Ø",           7.00),  # Fußrundungs-Ø
        ("tiefe",           "Tiefe",           5.60),  # radiale Zahntiefe
        ("breite",          "Breite Z",       11.00),  # axiale Gesamtdicke
        ("zahn_r",          "Zahn-Rundung",    0.40),  # Verrundung der Zahnkontur beidseitig (0 = scharf)
        ("fuehrung_w",      "Führung Breite",  1.00),  # Dicke des Führungsrings (0 = keiner)
        ("fuehrung_d",      "Führung Ø",      46.50),  # Führungsring-Außen-Ø (0 = auto)
    ]),
    ("Seitliche Schmutzabweiser", [
        ("steg_w",          "Steg Breite",     3.00),  # stehender Mittelsteg (Muldenabstand)
        ("seiten_t",        "Tiefe am Steg",   6.00),  # radiale Muldentiefe am Steg (Drehpunkt)
        ("tasche_b",        "Mulden-Breite",   5.00),  # tangentiale Breite je Mulde (0 = keine)
        ("mulde_winkel",    "Mulden-Winkel",  35.00),  # dreht an der Steg-Kante, nach außen tiefer (0 = gerade)
        ("mulde_r",         "Mulden-Rundung",  2.00),  # Radius der Winkelflächen-Verrundung
    ]),
    ("Zylinder (Kugellager)", [
        ("bohrung_d",       "Bohrung Ø",      14.00),  # zentrale Wellenbohrung (0 = keine)
        ("nabe_d",          "Nabe Ø",         20.00),  # Außen-Ø der Nabe (0 = keine)
        ("nabe_l",          "Nabe Länge",     13.00),  # axiale Länge der Nabe
        ("lager_d",         "Lagersitz Ø",    16.00),  # Flansch-Senkung beide Enden (0 = keine)
        ("lager_t",         "Lagersitz Tiefe", 1.00),  # Tiefe der Flansch-Senkung je Seite
    ]),
]

# Flache Liste aller Felder (für Persistenz & Standardwerte)
DEFAULT_FIELDS = [feld for _, felder in FIELD_SECTIONS for feld in felder]
