# 3D printing (PA12-CF)

[← Overview](../../README.md) · [All pages](../../README.md#documentation)

---

Configure the sprocket live in the [online tool](https://kaysiebke-cell.github.io/gates-cdx-kettenspanner-ritzel-generator-brompton/); its **Druck-Empfehlungen / Print guide** tab and the section below are generated from the same source (`web/js/print-data.js`), so they never drift apart.

<!-- PRINT:START (auto-generiert aus web/js/print-data.js – nicht von Hand ändern; `npm run build`) -->
> ✅ Field-tested: PA12-CF has proven itself in real continuous operation and meets the requirements – mileage of 2,800–2,850 km over about 5 months and still in use.
>
> **PA12-CF properties:** highly wear-resistant · stiff & dimensionally stable · low moisture absorption · good sliding properties (quiet running) · high fatigue endurance · chemically resistant · lightweight

### Print settings

| Parameter | Recommendation | Details |
|---|---|---|
| **Filament** | PA12-CF | Carbon-fiber reinforced nylon – extremely wear-resistant, stiff, absorbs less moisture than PA6. |
| **Nozzle** | ≥ 0.4 mm, hardened steel | CF fibers clog smaller nozzles and wear out brass – use a hardened steel (or ruby) nozzle. |
| **Infill** | 100% | Maximum stability and durability of the flanges – full infill is required. |
| **Layer height** | 0.12–0.16 mm | Fine layers for smooth running – the tooth flanks guide the belt, fine layers = low-vibration operation. |
| **Print speed** | Slow (~20–40 mm/s) | CF filament is abrasive and viscous – slower printing improves layer adhesion and dimensional accuracy. |
| **Cooling (part fan)** | 0–20% (as little as possible) | Too much cooling weakens layer adhesion – print PA12-CF with no or only minimal part cooling. |
| **Orientation** | Flat on the large face | Teeth are printed sideways – no support material needed on the flanks. |
| **Support** | Only hub & openings | The 1 mm deep bearing seat prints perfectly without supports. |
| **Nozzle temperature** | 250–280 °C (start: 260 °C) | PA12-CF needs high temperatures. Start at 260 °C, adjust ±5 °C as needed. The CF variant needs stable heat. |
| **Bed temperature** | 80–120 °C | PA12-CF needs a heated bed. Higher temperatures reduce warping and layer separation. |
| **Chamber temperature** | 60–80 °C | With enclosure: noticeably stabilizes print quality. PA12-CF is demanding – chamber control pays off. |
| **Drying** | 8 hours at 70 °C | Dry before printing (if the spool was left open). For long prints keep the spool in a drybox / with desiccant – nylon keeps absorbing moisture during printing. |

### Compatible printers for PA12-CF

- Prusa XL + Enclosure
- Bambu Lab X1 Carbon
- Prusa MK3S+ / MK3.9S + Enclosure
- Zortrax M300+ / M300 Dual
- Ultimaker S5 Pro

**Requirements:** Heated bed (80–120 °C) · Temperature-controlled chamber (ideal 60–80 °C) · Reliable cooling · Good bed adhesion (Bondtech, PEI, Garolite)

### Important notes

1. **PA12-CF is demanding** – not for beginners.
2. **Storage** – dry environment, silica gel.
3. **Annealing (optional)** – controlled annealing after printing (per manufacturer spec, often 1–2 h just below the softening temperature, then cool slowly) increases strength and dimensional stability under continuous mechanical load. Test on a sample first – slight warping is possible.
4. **Bearing-seat fit** – PA12-CF shrinks as it cools. Proven value: make the bearing-seat diameter +0.2 mm larger (14 mm bearing → 14.2 mm) for a firm press fit (e.g. F605-2RS). Verify on your own printer with a test print (shrinkage varies).
5. **Fracture strength** – PA12-CF is very stiff but more brittle than PA12. Do not overload.
6. **Check print quality** – make first samples before mass production.
7. **Health** – post-processing (sanding/drilling) creates irritating CF fine dust. Use extraction and a dust mask (FFP2/FFP3).

### Surface smoothing & sealing (optional)

> ⚠️ Mask functional surfaces – do not coat or sand: bearing seat (F605-2RS, +0.2 mm), tooth flanks (belt contact) and bore/axle seat.

1. **Fill** – Fill layer lines with thin cyanoacrylate (CA), epoxy (e.g. XTC-3D) or 2K filler primer – sanding alone is not enough on CF nylon.
2. **Wet-sand** – work through 240 → 400 → 600 → 1000+, wet-sanding – it binds the irritating CF fine dust. Wear an FFP2/FFP3 mask for dry work.
3. **Seal** – apply a thin epoxy or 2K PU clear coat (UV/weather-resistant). Degrease and lightly scuff the nylon first (poor adhesion otherwise); use a plastic adhesion promoter if needed.
4. **Order** – if annealing: anneal first, then seal (heat destroys coatings).
5. **Not advisable** – chemical vapour smoothing needs formic acid (toxic/corrosive) – avoid for hobby use; heat gun/flame warps CF nylon.

> ⚠️ This information is based on research (manufacturer specs, printer documentation, community experience, datasheets) and hands-on field experience (see box above). No guarantee – please test yourself before use and cross-check with current sources. For hobby projects; no commercial use without permission.
<!-- PRINT:END -->
