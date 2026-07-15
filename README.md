# Gates CDX Belt Tensioner Sprocket Generator (Brompton)

> Deutsche Version: [README.de.md](README.de.md)

This tool generates parametric **pulley wheels / guide sprockets for the original or modified Brompton belt tensioner** when the folding bike has been converted to the **Gates Carbon Drive (CDX)** belt drive system (e.g., via a Kinetics conversion). The sprockets are generated as finished 3D solids – optimized for 3D printing or CNC milling.

**Important:** This is *not* a load-bearing drive sprocket for the rear hub, but a ball-bearing **idler pulley / guide sprocket for the belt tensioner**!

![FreeCAD](https://img.shields.io/badge/FreeCAD-1.1%2B-blue)
![Python](https://img.shields.io/badge/Python-PySide6-green)

![Finished Sprocket](bilder/ritzel.png)

## Quick Start: Configure Online – No Installation Required

[![⚙ Open Configurator](https://img.shields.io/badge/%E2%9A%99%20Open%20Configurator-Live--Preview%20in%20Browser-blue?style=for-the-badge)](https://kaysiebke-cell.github.io/gates-cdx-kettenspanner-ritzel-generator-brompton/)

In the web configurator, you can **rotate and adjust the tensioner sprocket live in 3D**. The tooth profile, debris mud ports, belt guide, hub, and ball bearing seats update instantly based on your preferences.

**Two ways to download:**
* **Download ready-made STLs:** Pre-rounded files are available for standard sizes from **12 to 22 teeth** (also available with STEP files in the [Release "stl-serie"](https://github.com/kaysiebke-cell/gates-cdx-kettenspanner-ritzel-generator-brompton/releases/tag/stl-serie)).
* **Generate custom dimensions:** You can enter any parameters and drag the STL directly out of your browser (fillets are approximated here; the exact CAD fillets are included in the release files).

## Direct Usage in FreeCAD

1. Copy the project folder into your FreeCAD macro directory (or any location of your choice).
2. Run `freecad/main.py` as a macro in FreeCAD. The **"Zahnrad Setup"** (Gear Setup) panel will automatically dock on the right side.

| Button | Function |
|---|---|
| **Vorschau** (Preview) | Redraws only the sketch of the tooth profile (extremely fast). |
| **Körper erzeugen** (Create Body) | Builds the complete PartDesign solid body. |
| **Fertigteil** (Finished Part) | Creates a clean copy (`RitzelFertig`) without the feature tree – perfect for STL/STEP export. |

**Tip:** The **"Rundungen anwenden"** (Apply Fillets) checkbox controls the fillets. Since these consume the most performance during calculation, it is best to leave them unchecked for quick drafts. Enable them only for the final part export.

**Prerequisites:** FreeCAD 1.1+ (tested as Flatpak on Linux), no additional dependencies. The panel UI is in German.

<img src="bilder/panel.png" alt="Zahnrad Setup Panel" width="320">

## Features

* **Fully Parametric:** Tooth count, pressure angle, pitch, tip/root radius, and tooth depth can be freely adjusted.
* **Thoughtful Geometry:** Central ridge acting as a belt guide, lateral mud/debris ports (angle, depth, and radius adjustable), plus a bore and counterbores for the belt tensioner bearings.
* **Smart UI:** The dock panel is clearly structured and automatically adapts to the FreeCAD theme (Light/Dark Mode).
* **Remembers Settings:** The last used parameters are automatically reloaded on the next startup.
* **Fillet Cache:** The tool remembers working radii. If a calculation fails, it doesn't completely reset, saving expensive processing time.
* **Cloud-Build & Web Configurator:** Fully usable in the browser if you don't have FreeCAD installed.

## 3D Printing (PA12-CF)

The sprocket is designed for **PA12-CF** (carbon-fiber reinforced nylon) and is **field-tested in continuous operation: ~2,800–2,850 km in about 5 months, and still running.** In short: 100 % infill, fine layers (0.12–0.16 mm), printed flat on the large face, on a heated bed with an enclosure, a hardened-steel nozzle (≥ 0.4 mm), and little to no part cooling.

👉 **The complete, always up-to-date recommendations** – filament, temperatures, print speed, cooling, drying, annealing, compatible printers, bearing-seat fit and safety notes – live in the **Druck-Empfehlungen / Print guide** tab of the [online tool](https://kaysiebke-cell.github.io/gates-cdx-kettenspanner-ritzel-generator-brompton/). It is bilingual (DE/EN) and the single source of truth, so the guidance can't drift out of sync.

> ⚠️ The recommendations combine research with the author's own field experience. No guarantee – always test on your own printer.

## Matching Ball Bearings

The default values (Bore Ø 14 mm, bearing seat Ø 16 mm × 1 mm) are designed exactly for the **F605-2RS (5 × 14 × 5 mm)** miniature flanged ball bearing, which fits perfectly onto the Brompton belt tensioner axle. You will need 2 pieces (one per side), with the flange resting in the 1 mm deep recess.

<img src="bilder/f605-2rs-zeichnung.jpg" alt="F605-2RS Dimension Drawing" width="280">

* **Important:** Be sure to get the **2RS variant** (rubber-sealed on both sides). They provide much better protection against rain and road grit on the belt tensioner than metal-shielded (ZZ) versions.
* For all-weather commuters, the stainless steel version **SF605-2RS** is highly recommended.
* **Test the Fit:** PA12-CF shrinks as it cools. The author's proven value is to make the bearing-seat diameter **+0.2 mm** larger (e.g. a 14 mm bearing → 14.2 mm) for a firm press fit. Shrinkage varies by printer, so print a small test ring first and fine-tune the `Bore Ø` parameter in 0.1 mm steps.
* **Press, Don't Hammer:** Carefully press the bearings into place (e.g., using a vise with a matching washer). Apply force only to the outer ring, never to the inner ring.

## File Structure

| File | Content |
|---|---|
| `freecad/main.py` | The entry point for FreeCAD, cleanly imports all modules. |
| `freecad/zahnrad_ui.py` | The control panel (inputs, buttons, saving values). |
| `freecad/zahnrad_generator.py` | The actual geometry: Tooth profile sketch and 3D body generation. |
| `freecad/zahnrad_params.py` | Definition of variables and default values. |
| `web/index.html` | The web configurator (hosted via GitHub Pages). |
| `freecad/build_headless.py` | Helper script: Builds the release series (STEP/STL) in the background without a GUI. |
| `freecad/render_gui_preview.py` | Cloud Build: Renders the preview using Xvfb. |
| `freecad/ritzel_params.py` | Cloud Build: Default values and JSON overrides. |
| `.github/workflows/build-ritzel.yml` | GitHub Action for automated builds. |

## Legal Disclaimer & Liability

Gates® and CDX® are registered trademarks of Gates Corporation; Brompton and Kinetics are trademarks of their respective owners. This project is an independent hobbyist tool. It is not affiliated with the manufacturers and does not use original manufacturing data – the geometry was independently measured and reverse-engineered from a retail part.

**For Private Use Only:** Components of the Gates Carbon Drive System may be protected by patents. In many jurisdictions (e.g., according to § 11 No. 1 PatG in Germany), private, non-commercial production for one's own bicycle is exempt from patent protection. However, **commercial production or sale** of the generated sprockets may infringe upon third-party rights and is done entirely at your own risk.

The use of self-printed components in public traffic is at your own responsibility.
