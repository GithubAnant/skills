---
name: filled-ui-icons
description: Create or extend crisp custom filled SVG icon families for feature grids, cards, and product UI. Use for requests matching Shogun's six-card feature icons, solid icons with clean negative-space cutouts, or a consistent bespoke icon set; not for brand logos or illustrations.
---

# Filled UI Icons

Make small icons read as designed silhouettes, not outline icons made heavier. Reference style: Shogun's calendar, document, search, sparkles, inbox, and shield feature icons. Their polish comes from simple geometry, meaningful cutouts, consistent visual density, and quiet placement—not effects.

## Build the family

- Inspect the existing set and intended display size first. Preserve its vocabulary when adding icons. For a new family, start with `viewBox="0 0 24 24"`, a roughly 20 × 20 optical footprint, and 2-unit margins. Adjust round and diagonal forms optically rather than forcing identical bounds.
- Choose one immediately recognizable metaphor per icon. Prefer a strong outer silhouette plus one defining interior detail. Avoid tiny secondary badges and decorative marks unless necessary to convey meaning.
- Construct filled shapes directly. Do not increase an outline library's stroke width and call it a filled family. Use `fill="currentColor"`; use `fill-rule="evenodd"` for holes. Keep cutouts genuinely transparent so the icon works on any surface.
- At 24px, start with about 2-unit structural thickness and 1.5–2-unit negative-space channels. Inspect the actual size; simplify details that close up at 16px rather than scaling blindly.
- Keep corner treatment coherent: about 2-unit radii on containers, tighter corners on small details. Preserve crisp geometric features where rounding would weaken recognition. Match curves and joins, not just bounding boxes.
- Compare apparent ink weight side by side. A broad filled document will feel heavier than a hollow search icon; increase its cutout area or reduce its footprint instead of adding weight indiscriminately to every icon.
- Keep circles, straight edges, and repeated details geometrically consistent. Align orthogonal geometry to whole or half units when useful; do not snap curves if doing so damages the silhouette.

Read [the seed icons](references/seeds.md) when matching the original family. They demonstrate geometry, not a required palette or mandatory metaphors.

## Deliver

Use the project's existing SVG/component conventions. No new icon dependency for a handful of shapes. Prefer a named SVG or a small path map for a compact family; avoid a configurable icon framework nobody requested.

Decorative icons: `aria-hidden="true"`, `focusable="false"`. Meaningful standalone controls need an accessible name on the control. Keep CSS color outside the path so themes and interaction states inherit correctly.

The original feature-grid treatment was 24px, muted `#c2c4cb`, with 18px space before the heading. Treat those as reference values, not universal requirements. Do not add gradients, blur, shadows, or animation to compensate for weak geometry.

## Check before calling them finished

Render the family together at 16, 20, 24, and 32px, on light and dark surfaces. Check real-size recognition, open cutouts, balanced weight, centering, and consistent corner language. Zooming the SVG alone is insufficient. If screenshot/render tools are unavailable, state that visual validation is still pending.

Compare with adjacent text and existing icons in the actual UI. Fix the outlier, not the entire set. Preserve user-selected references and style; do not silently replace this family with Lucide or another outline package.
