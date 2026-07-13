# Anant Skills

A Claude Code plugin for design workflows, repo automation, and reusable agent procedures.

## Skills

| Skill | What it does |
|-------|-------------|
| [60-30-10 Color Rule](#-60-30-10-color-rule) | Color palette framework adapted from cinematic color theory |
| [Capy](#-capy--design-system-inspector--preview-builder) | Scans your codebase to extract tokens, discover components, and build a `/preview` route |
| [Owner Deploy Trigger](#owner-deploy-trigger) | Sets up owner empty-commit GitHub Actions deploy triggers |
| [Next.js GitHub CMS](#nextjs-github-cms) | Drops a password-protected `/editor` page into a Next.js site that commits content + images to GitHub — no database |
| [Progressive Blur](#progressive-blur) | Layered `backdrop-filter` masks that fade a soft progressive blur from the top or bottom edge of the viewport |
| [Shine Sweep Button](#shine-sweep-button) | A glistening diagonal light streak that glides across a button on hover — and glides back out at matching speed |
| [Infinite Pan Grid](#infinite-pan-grid) | Smooth bidirectional infinite 2D pan grids in React/Next.js — GPU transform, no scrollbars, no lag |
| [Responsive 3D Hero](#responsive-3d-hero) | basement.studio-style wireframe R3F heroes in Next.js — per-route cameras, postFX, asset manifests, no Sanity |
| [Create Donut Chart](#create-donut-chart) | Build lightweight, interactive, dependency-free custom SVG donut charts in React |

---

### 60-30-10 Color Rule

> A framework for building visually coherent UIs — adapted from how cinematographers and production designers control color in film.

**Example triggers:**
`"pick a color palette"` · `"my UI looks off"` · `"how do I make my CTA pop"` · `"help with dark mode colors"` · `"structure my CSS color tokens"`

---

### Capy — Design System Inspector & Preview Builder

> Scans React/Next.js repos to extract CSS variables, discover components, detect the framework, and build a polished `/preview` route — all from the actual codebase, never hallucinated.

**Subcommands:**

| Command | Action |
|---------|--------|
| `/capy` | Full scan + build the `/preview` page |
| `/capy design-system` | Scan + write `.capy/design-system.json` only |
| `/capy update` | Incremental refresh — detect changes, update preview |

**Example triggers:**
`"build a component catalog"` · `"extract design tokens"` · `"audit my design system"` · `"create a /preview page"`

---

### Owner Deploy Trigger

> Configures a GitHub Actions workflow that turns non-owner pushes into owner-authored empty deploy trigger commits, with optional Vercel deploy hook support.

**Example triggers:**
`"set up owner deploy trigger"` · `"make non-owner commits trigger owner deploys"` · `"audit the OWNER_GIT_PAT workflow"` · `"why is chore: trigger deploy skipped"`

---

### Next.js GitHub CMS

> Installs a self-hosted, no-database CMS into a Next.js (App Router) site: a password-protected `/editor` page where a non-technical user edits structured content and images, with every save committed to GitHub via the REST API. Pairs with **Owner Deploy Trigger** for the Vercel free-plan cross-account deploy fix.

**Example triggers:**
`"add an editor page so my client can edit the site"` · `"build a CMS without a database"` · `"store site content in GitHub"` · `"let me edit copy and images and auto-deploy"`

---

### Progressive Blur

> A layered `backdrop-filter` blur that fades softly in from the top or bottom edge of the viewport. Uses stacked masked layers (0.5px → 64px) for a smooth depth gradient rather than a hard blur line. Ships top and bottom snippets plus knobs for height, strength, direction, and step count.

**Example triggers:**
`"add a progressive blur"` · `"gradient blur overlay at the bottom"` · `"stepped backdrop-filter that fades from an edge"` · `"soft blur fade over my footer"`

---

### Shine Sweep Button

> A glistening diagonal band of light that glides across a button on hover and glides back out at matching speed — that premium SaaS landing-page glint. Uses a clipped, skewed gradient pseudo-element whose `left` is animated by a CSS `transition` (not a keyframe), so entry and exit feel symmetric. Ships the canonical recipe plus knobs for speed, width, brightness, and slant, with adapts for Tailwind and styled-components.

**Example triggers:**
`"make the button glisten on hover"` · `"add a shine sweep to my CTA"` · `"that moving glare thing on buttons"` · `"glossy hover but don't make it jump"`

---

### Infinite Pan Grid

> Builds true infinite 2D pan grids in React and Next.js — unbounded in all directions, no scrollbars, smooth wheel + drag. Uses a GPU `translate3d` world layer with manual viewport culling so React only re-renders when the visible cell window changes, not every pan frame. Includes the scrollbar fix, perf anti-patterns, polkadot pop-in animation, and Next.js App Router wiring.

**Example triggers:**
`"infinite scroll grid in all directions"` · `"panning tile wall without scrollbars"` · `"fix laggy infinite grid"` · `"2D infinite canvas in React"` · `"bidirectional scroll no snap"`

---

### Responsive 3D Hero

> Builds responsive wireframe/interactive 3D hero sections in Next.js App Router with React Three Fiber — fixed canvas, per-route cameras, shader postprocessing, GLB asset manifests, and offscreen loading transitions. Hardcoded config pattern from the basement-studio-clean fork (no Sanity CMS).

**Example triggers:**
`"build a 3D wireframe hero"` · `"basement.studio landing page"` · `"R3F scroll-linked camera"` · `"per-route 3D scene config"` · `"wireframe GLB loading intro"`

---

### Create Donut Chart

> Builds a high-quality, interactive, dependency-free SVG donut chart in React without heavy charting libraries. Maps data to SVG circle circumferences with `strokeDasharray`, sweeping entry animations, and hover-linked interactive legends.

**Example triggers:**
`"make a donut chart"` · `"build a pie chart"` · `"data visualization without recharts"` · `"circular chart with legend"`

---

## Installation

Add the marketplace, then install:

```bash
/plugin marketplace add GithubAnant/skills
/plugin install design-skills@anant-design
```

Or test locally:

```bash
claude --plugin-dir /path/to/this/repo
```

## License

MIT
