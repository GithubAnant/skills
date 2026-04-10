---
name: capy
description: >
  Design-system inspector and /preview page builder for React and Next.js projects. Scans the real
  codebase to extract CSS variables, discover components, detect the framework, and build a polished
  /preview route — all without hallucinating colors, tokens, or component APIs. Use this skill
  whenever the user asks to build a UI preview, component catalog, design-system audit, or /preview
  page. Also triggers on requests to extract design tokens, audit styles, catalog components, update
  an existing preview, or any mention of "capy". Subcommands: /capy (or /capy preview), /capy design-system,
  /capy update.
---

# Capy — Design System Inspector & Preview Builder

Capy scans a React/Next.js repository and produces two things: a machine-readable design-system
artifact (`.capy/design-system.json`) and a polished `/preview` route that showcases the app's
real colors, typography, components, and icons. Every value comes from the actual codebase — nothing
is invented.

## Subcommand routing

| Invocation | Action |
|---|---|
| `/capy` or `/capy preview` | Full scan + build the `/preview` page (default) |
| `/capy design-system` | Scan + write `.capy/design-system.json` only |
| `/capy update` | Detect changes since last snapshot, refresh design system, update preview incrementally |

---

## Phase 1 — Framework Detection

Read `package.json` at the project root. Parse its `dependencies` and `devDependencies`.

**Detection rules (evaluate in order, stop at first match):**

1. **`next` in deps AND directory `src/app/` exists** → Next.js App Router
   - routingStyle: `app-router`
   - previewEntryFile: `src/app/preview/page.tsx`
2. **`next` in deps AND directory `app/` exists** → Next.js App Router
   - previewEntryFile: `app/preview/page.tsx`
3. **`next` in deps AND directory `src/pages/` exists** → Next.js Pages Router
   - routingStyle: `pages-router`
   - previewEntryFile: `src/pages/preview.tsx`
4. **`next` in deps AND directory `pages/` exists** → Next.js Pages Router
   - previewEntryFile: `pages/preview.tsx`
5. **`react` AND `react-router-dom` in deps** → React Router
   - routingStyle: `react-router`
   - previewEntryFile: `src/routes/preview.tsx`
6. **`react` only (no router)** → React without router
   - **Ask the user** to confirm router setup before proceeding. Do not silently pick a path.
7. **None of the above** → Unknown framework
   - **Ask the user** to clarify the routing approach.

**Package manager:** Check the `packageManager` field in package.json. If it starts with `pnpm` → pnpm, `yarn` → yarn, `bun` → bun, otherwise default to `npm`.

Store these results as the "framework info" for all subsequent phases.

---

## Phase 2 — Project Facts Discovery

### 2a. Find all source files

Glob for `**/*.{ts,tsx,js,jsx}`. Exclude these patterns:
- `**/*.test.*`, `**/*.spec.*`, `**/*.stories.*`, `**/*.story.*`
- `**/node_modules/**`, `**/.next/**`, `**/dist/**`, `**/build/**`
- `**/coverage/**`, `**/.git/**`, `**/.capy/**`, `**/preview/**`

### 2b. Find page directories

Scan the source file list for routing marker filenames:
- App Router markers: `layout.tsx`, `layout.ts`, `layout.jsx`, `layout.js`, `page.tsx`, `page.ts`, `page.jsx`, `page.js`
- Pages Router markers: `_app.tsx`, `_app.ts`, `_app.jsx`, `_app.js`, `_document.tsx`, `_document.ts`
- SvelteKit markers: `+page.svelte`, `+layout.svelte`

Collect the parent directory of each marker file. Then **deduplicate to root-most directories** — if both `src/app` and `src/app/blog` appear, keep only `src/app` (any directory that is a prefix of another is sufficient).

### 2c. Find component directories

Only examine `.tsx` and `.jsx` files (plain `.ts`/`.js` are utilities/hooks, not components).

For each `.tsx`/`.jsx` file:
1. Skip if it's inside a page directory found in 2b
2. Skip if its base name (without extension) is a route filename: `layout`, `page`, `loading`, `error`, `not-found`, `template`, `default`, `route`, `middleware`, `_app`, `_document`, `_error`
3. Read the file and check for a PascalCase export with this regex:
   ```
   export\s+(?:default\s+)?(?:function|const|class)\s+[A-Z][A-Za-z0-9_]*
   ```
4. If a match is found, count that file's directory as containing a component

Deduplicate to root-most directories (same algorithm as 2b).

### 2d. Find style files

Glob for `**/*.{css,scss,sass,less}`. Exclude `**/node_modules/**`, `**/.next/**`, `**/dist/**`, `**/build/**`, `**/.capy/**`, `**/coverage/**`. Also filter out any file whose path contains `/preview/`.

### 2e. Summary

After discovery, briefly report to the user:
- Detected framework and routing style
- Preview entry file path
- Number of component directories found (list them)
- Number of style files found
- Number of page directories found

---

## Phase 3 — CSS Variable Extraction

For each style file discovered in Phase 2d, read the file and extract CSS custom properties using this regex:

```
--([A-Za-z0-9-_]+)\s*:\s*([^;}{]+);
```

**Categorize each variable by its name:**

| Category | Name matches (case-insensitive) |
|---|---|
| `color` | `color`, `bg`, `text`, `border`, `surface`, `accent`, `primary`, `secondary`, `foreground` |
| `typography` | `font`, `type`, `text`, `leading`, `tracking`, `heading`, `body` |
| `layout` | `gap`, `radius`, `shadow`, `size`, `width`, `height` |
| `other` | Everything else |

Note: `text` matches both color and typography — but since color is checked first, variables with `text` in the name will be categorized as color. This matches the original Capy behavior.

Record each variable as: `{ name, value, category, file, line }`.

---

## Phase 4 — Component Collection

For each component directory from Phase 2c, glob for `**/*.{tsx,jsx,ts,js}` inside that directory. Exclude test files, stories, node_modules, dist, build, preview, and coverage.

For each file, extract PascalCase exports using these four regex patterns:
```
export\s+function\s+([A-Z][A-Za-z0-9_]*)
export\s+const\s+([A-Z][A-Za-z0-9_]*)
export\s+class\s+([A-Z][A-Za-z0-9_]*)
export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)
```

**Classify the component kind by its file path:**
- Path contains `/features/` → `"feature"`
- Path contains `/ui/` → `"primitive"`
- Path contains `/components/` → `"component"`
- Otherwise → `"unknown"`

The first export found becomes the component's display name. If no exports are found, use the filename (without extension) as a fallback.

### Component family summary

Group discovered components by their parent directory. For each directory, list up to 5 component names. If more than 5, add "and N more". Example:
```
src/components/ui/: Button, Card, Input, Badge, Avatar and 3 more.
```

---

## Phase 5 — Write Design System Artifact

Write `.capy/design-system.json` with this exact structure:

```json
{
  "artifact": {
    "generatedAt": "<ISO timestamp>",
    "mode": "build",
    "artifactPath": ".capy/design-system.json",
    "changedFiles": []
  },
  "repo": {
    "framework": "<framework kind>",
    "routingStyle": "<routing style>",
    "previewRoute": "/preview",
    "previewEntryFile": "<detected entry file>",
    "packageManager": "<detected package manager>"
  },
  "scan": {
    "componentDirs": ["<dirs>"],
    "pageDirs": ["<dirs>"],
    "styleFiles": ["<files>"],
    "uiDirs": ["<dirs>"],
    "discoveredFamilies": ["<family summary strings>"]
  },
  "tokens": {
    "cssVariables": [
      { "name": "--example", "value": "#fff", "category": "color", "file": "src/styles/globals.css", "line": 12 }
    ],
    "themeSourceFiles": ["<style files>"]
  },
  "components": {
    "count": 0,
    "items": [
      { "name": "Button", "path": "src/ui/button.tsx", "exports": ["Button"], "kind": "primitive" }
    ]
  }
}
```

Use the Write tool to create the `.capy/` directory and file. This completes the `/capy design-system` subcommand.

---

## Phase 6 — Build the Preview Page

This phase only runs for `/capy preview` (or bare `/capy`). Read `references/design-guidance.md` before starting this phase — it contains the full visual specification.

### 5-step inspection plan

**Step 1 — Read app shell and routing entry points.**
Based on the routing style:
- App Router: read `layout.tsx` and `page.tsx` in each page directory
- Pages Router: read `_app.tsx` in each page directory
- Unknown/other: read both `layout.tsx`, `page.tsx`, and `_app.tsx`

This tells you the project's visual language — what providers wrap the app, what global styles are applied, what layout structure exists.

**Step 2 — Read global styles and theme sources.**
Read up to 8 of the style files from Phase 2d. Extract real colors, typography scales, spacing tokens, and theme conventions. Everything in the preview must come from what you find here — never invent values.

**Step 3 — Discover components in component directories.**
Read files in the component/UI directories. For each component with a PascalCase export, note its name, path, props (if readable from the file), and kind. If no component directories were found, check these fallback locations: `src/components`, `components`, `src/ui`, `ui`, `src/features`, `features`.

**Step 4 — Trace real usage paths.**
For each discovered component, search the page directories for import statements that reference it. This validates that the component is actually used in the app (not just exported). Only showcase components with confirmed real usage in the preview. If a component has no usage, note it but don't fabricate example code.

**Step 5 — Implement the preview route.**
Create the preview entry file (the path from Phase 1). Follow the design guidance in `references/design-guidance.md` precisely. The page should:
- Be a single self-contained React component (with all styles inline or in a co-located CSS module)
- Display sections in this order: **Foundations, Colors, Icons, Typography, Inputs, Actions, Navigation, Data Display, Feedback, Overlays, Components, Feature or Page Sections**
- Only include sections where real content was discovered
- Import and render real components from the repo where possible

### Anti-hallucination constraints

These are critical. The preview page must:
1. **Never invent colors, typography values, or component APIs.** Every value displayed must trace back to an actual file in the repo.
2. **Prefer real components.** Import and render them rather than creating mock versions.
3. **Mirror real usage flows.** If a component requires a provider or specific props, replicate how it's actually used in the app's pages.
4. **Validate before showcasing.** Only include a component in the preview after confirming it exists and finding at least one real usage.
5. **Follow the design guidance** for layout, spacing, theming, and responsiveness. Don't overuse bordered containers.

### After building the preview

1. Write the design system artifact (Phase 5) if not already done
2. Add `.capy/` and the preview entry file path to `.gitignore` (append if not already present)
3. Tell the user the preview is ready and how to view it (e.g., navigate to `/preview` in their dev server)

---

## Phase 7 — Update Preview (`/capy update`)

This phase runs only for `/capy update`.

### Step 1 — Check for existing snapshot

Look for `.capy/preview-state.json`. This file stores SHA-1 hashes of all tracked source files from the last run.

**If no snapshot exists:** Create a baseline by hashing all source files (`**/*.{ts,tsx,js,jsx,css,scss,sass,less,vue,svelte}`, excluding node_modules/.next/dist/build/coverage/.git/.capy). Write the snapshot to `.capy/preview-state.json`. Tell the user: "No prior snapshot found — created a baseline. The next `/capy update` will detect changes from this point."

**If a snapshot exists:** Read the previous snapshot. Build a new snapshot of current file hashes. Compare:
- Files in current but not previous → added
- Files in previous but not current → deleted
- Files where hash differs → modified

Collect all changed file paths.

### Step 2 — Refresh design system

Re-run Phases 2–5 with `mode: "update"` and the `changedFiles` list populated.

### Step 3 — Update the preview

Follow the update strategy:
- Inspect changed files first and revise only affected preview sections where possible
- If a changed file affects shared foundations (global styles, theme, layout), update every section that depends on those foundations
- Don't rebuild the entire page unless the current structure is no longer representative
- If no changed files were detected, check `git diff` or ask the user what changed

### Step 4 — Save new snapshot

Write the current file hashes to `.capy/preview-state.json`, replacing the old snapshot.

---

## Quick reference: glob patterns used throughout

| Purpose | Pattern | Excludes |
|---|---|---|
| Source files | `**/*.{ts,tsx,js,jsx}` | test, spec, stories, story, node_modules, .next, dist, build, coverage, .git, .capy, preview |
| Style files | `**/*.{css,scss,sass,less}` | node_modules, .next, dist, build, .capy, coverage; also filter `/preview/` paths |
| Components in dirs | `<dir>/**/*.{tsx,jsx,ts,js}` | test, spec, stories, story, node_modules, .next, dist, build, coverage, .git, .capy, preview |
| Snapshot tracking | `**/*.{ts,tsx,js,jsx,css,scss,sass,less,vue,svelte}` | node_modules, .next, dist, build, coverage, .git, .capy |
