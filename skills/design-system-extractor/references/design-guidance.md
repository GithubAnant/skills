# Preview Page Design Guidance

Read this file before building or updating the `/preview` page. Every specification here should be
followed precisely — the preview page is meant to feel like a polished design document, not a debug dump.

## Section Order

Display sections in this exact order. Only include sections where real content was discovered during
the scan — don't create empty placeholder sections.

1. **Foundations** — App shell structure, providers, global layout patterns
2. **Colors** — All color tokens extracted from CSS variables and theme files
3. **Icons** — Icon components discovered in the repo (if any)
4. **Typography** — Font families, weights, sizes, line heights from the design system
5. **Inputs** — Form inputs, text fields, selects, checkboxes, etc.
6. **Actions** — Buttons, links, interactive triggers
7. **Navigation** — Nav bars, sidebars, breadcrumbs, tabs
8. **Data Display** — Tables, lists, cards, badges, avatars
9. **Feedback** — Toasts, alerts, progress indicators, skeletons
10. **Overlays** — Modals, dialogs, drawers, popovers, tooltips
11. **Components** — General reusable components that don't fit above
12. **Feature or Page Sections** — Larger composed sections from the features/ directory

---

## Page Structure

- Sticky header with subtle backdrop blur: `backdrop-filter: blur(10–12px)`
- Max-width content column: `~960px`, centered
- Anchor IDs on every section heading with `scroll-margin-top: 5rem` so jump-links land below the sticky header
- Optional left sidebar or top navigation bar for quick section jumping
- The header should include the project name and a dark/light mode toggle

---

## Whitespace

Generous whitespace is what separates a polished design document from a cramped debug dump. These
values are intentionally large — they create clear visual separation between sections.

- **Section gap:** 10–14rem between major sections (this is the most important spacing rule)
- **Sub-section gap:** 2.5–3rem between subsections within a section
- **Specimen gap:** 1–1.5rem between individual specimens in a group
- **Container padding:** 1.5–2rem inside any containing surface
- **Use spacing instead of borders** to define structure wherever possible

---

## Typography

Use the project's own typography system when available. For the preview page's own UI chrome:

- **Section titles:** 1.6–1.75rem, weight 600–700
- **Sub-headings:** 1rem–1.125rem, weight 500–600
- **Labels:** 0.75rem, monospace font
- **Body text:** 0.9rem, line-height 1.5–1.6
- Typography specimens should show the actual font name, weight, and size metadata alongside the rendered sample text

---

## Surfaces & Backgrounds

- **Avoid default borders** on containers — they make the page feel cluttered
- Use at most **2 surface levels**: a base background and a subtle elevated background
- Dark mode base: `#070a10`, elevated: `#0c1118`
- Light mode base: `#ffffff`, elevated: `#f5f5f5`
- Specimen containers use the elevated surface; the page itself uses the base

---

## Color Swatches

- Swatch size: **64–80px** squares with **8–10px** border-radius
- Layout: responsive `auto-fill` grid (not a fixed column count)
- Group swatches by semantic role: background, foreground, primary, accent, muted, etc.
- Display hex values in **6-character format** (e.g., `#1a2b3c`), monospace font
- **Click-to-copy** on each swatch: `cursor: pointer`, copy the hex to clipboard
- Provide copy feedback: brief toast or temporary label change (e.g., "Copied!")
- Ensure swatches have sufficient contrast against both dark and light backgrounds

---

## Component Specimens

- Render components at their **natural size** — don't squeeze or stretch them
- Use **subtle background surfaces** instead of bordered cards to contain specimens
- Each specimen should have a label (component name) and show props/variants if applicable
- **Limit initial display to ~12 items** per section; add a "Show all" toggle for sections with more
- Import and render real components from the repo. If a component needs props, use realistic values derived from how the component is actually used in pages

---

## Icons

- Display in a **grid layout** with 40–48px cells
- Show the icon name below each icon in monospace
- If the project uses an icon library (lucide, heroicons, etc.), discover and display available icons
- Limit to ~12 initially with "Show all" toggle

---

## Theming

The preview page itself should support dark and light modes:

- Toggle via a root `class` (e.g., `dark`) or `data-theme` attribute
- Add a **visible toggle button** in the sticky header
- **Persist** the user's choice in `localStorage`
- **Default** to `prefers-color-scheme` media query
- Both modes must look good — test contrast on swatches, text, and surfaces

---

## Interaction

- Color swatches: clickable with `cursor: pointer`, copy hex on click
- Copy feedback: brief toast notification or temporary label change ("Copied!")
- Hover states should be subtle: slight opacity change or background shift
- Section navigation should use smooth scrolling
- Allow both vertical and horizontal scrolling when a section benefits from a canvas-like layout (e.g., a wide horizontal row of component variants)

---

## Responsiveness

- **Below 768px:** Switch to single column layout, reduce section spacing to ~4rem
- **Below 640px:** Collapse navigation into a hamburger or dropdown
- **Horizontal rows:** Use `overflow-x: auto` so wide content scrolls horizontally rather than breaking the layout

---

## Layout Guidelines (summary)

1. At least 4rem (64px) vertical gap between major sections (10–14rem preferred)
2. Clear heading with a subtle horizontal rule or divider for each section
3. Content max-width ~900–1000px
4. Group related specimens with clear visual separation
5. Don't cram unrelated specimens into one row — give each room to breathe
6. Consistent padding inside specimen containers (at least 1.5rem)
7. Color swatches at least 64x64px with clear labels below
8. Typography specimens show font name, weight, and size alongside rendered text
9. Sticky sidebar or top nav for section jumping
10. The page should feel like a polished design document

---

## Interaction Features

- Allow both vertical and horizontal scrolling when the preview benefits from a canvas layout
- Display icons in a dedicated section whenever they can be discovered
- Render color swatches with 6-character hex labels in a consistent format
- Use pointer cursor and click-to-copy for hex values

---

## What NOT to do

- Don't invent colors or typography values not found in the codebase
- Don't fabricate component props or usage patterns
- Don't use heavy borders around every container
- Don't make a dense, cramped layout — err on the side of too much whitespace
- Don't add components to the preview that you can't verify are actually used
- Don't create a "debug dump" aesthetic — this should look like a design team's internal tool
