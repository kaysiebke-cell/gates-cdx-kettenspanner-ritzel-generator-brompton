# Spokes (save material)

[← Overview](../../README.md) · [All pages](../../README.md#documentation)

---

A solid web runs between hub and tooth rim across the full width. Structurally it is not needed: the part is a ball-bearing idler pulley and transmits no torque – the web only keeps the tooth rim concentric with the hub. The **Spokes** field cuts openings into it.

| Parameter | Meaning |
|---|---|
| `Spokes` | Number of arms. **0 = off** (default), 4–6 make sense. |
| `Spoke Width` | Width of one arm across the spoke (default 4.5 mm). |
| `Sweep (°)` | 0° = straight, radial spokes. Larger values bend the arms tangentially. If the value does not fit the ring, it is reduced automatically. |
| `Wall Thickness` | Material left standing at the tooth rim **and** at the hub (default 2.0 mm). Every extra millimetre costs the free ring 2 mm – above that the web stays solid: 17 teeth up to 2.5 mm, 18 teeth up to 3.0 mm, 19 teeth up to 4.0 mm. |
| `Spoke Round` | Corner radius of the openings. Drawn directly in the sketch, not as a 3D fillet. |

**When it pays off:** What limits the spokes is not the tooth root but the dirt pocket. It deepens towards the face by `Pocket Angle` and ends there about 2.8 mm further in than at the central ridge – only below that does material span the full width. If less than 5 mm of free ring remains between hub collar and rim, no spokes are built at all and the web stays solid. With the default values the limit sits at 17 teeth:

| Teeth | Free ring | 5 straight spokes |
|---|---|---|
| ≤ 16 | < 5 mm | – (web stays solid) |
| 17 | 6.4 mm | −4.9 cm³ (≈ 5.2 g) |
| 18 | 8.0 mm | −6.6 cm³ (≈ 7.0 g) |
| 19 | 9.6 mm | −8.6 cm³ (≈ 9.1 g) |

To get spokes on smaller sprockets, reduce `Side Depth` or `Pocket Angle` first.

> **Note:** The pre-built release files (12–19 teeth) are built without spokes. As soon as you enable spokes your values differ from the standard – download the STL straight from the browser; there is currently no cloud build for custom STEP values (relay switched off) – build the body in FreeCAD instead.
