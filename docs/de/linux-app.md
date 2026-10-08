# Linux-App (GTK, Cinnamon-Stil)

[← Übersicht](../../README.de.md) · [Alle Seiten](../../README.de.md#dokumentation)

---

<img src="../../bilder/ansicht-linux.png" alt="Linux-App im Cinnamon-Stil" width="720">

Ein richtiges **GTK-Programm** für Linux Mint/Cinnamon. Formular, Reiter und Knöpfe sind echte GTK-Bausteine und folgen deinem Systemdesign (Farben, Schrift, Hell/Dunkel). **Kein Browser**, keine Adresszeile, **kein Chrome**. Läuft offline.

- Die Berechnung übernimmt dieselbe Logik wie in der Web-Version. Sie läuft im Hintergrund, die Oberfläche liest ihre Felder daraus. Nur die 3D-Vorschau ist eine WebView.
- Reiter Ritzel, Spannrolle, Druck-Empfehlungen · Sprache DE/EN · Erklärungen ein/aus.
- Downloads (ZIP mit STL, STEP) landen in `~/Downloads`.
- Ein zweiter Start holt das vorhandene Fenster nach vorn.

**Installieren** (Paket bauen und einspielen, im Projektordner):

```bash
linux/bauen-deb.sh
sudo apt install ./linux/dist/ritzel-generator_*_all.deb
```

Danach „Ritzel-Generator“ im Anwendungsmenü starten (oder `ritzel-generator` im Terminal). Voraussetzungen: `python3-gi`, `gir1.2-gtk-3.0`, `gir1.2-webkit2-4.1` (werden vom Paket angefordert).

**Ohne Installation ausprobieren:**

```bash
npm install && npm run build:shell && npm run build:viewer
python3 linux/ritzel-generator.py
```

Mehr dazu: [`linux/README.md`](../../linux/README.md).
