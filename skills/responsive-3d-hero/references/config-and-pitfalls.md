# Config, CMS Fork History, and Pitfalls

## Hardcoded config pattern (no Sanity)

The reference fork removed live Sanity fetches for 3D config. Runtime uses:

```ts
// src/content/3d-config.ts
export const THREE_D_CONFIG = { scenes: [...], inspectables: [...], physics: {...} }
export async function fetchThreeDConfig() { return THREE_D_CONFIG }
```

Comment in file: *"Exported from upstream Sanity — do not hand-edit camera values."*

**For new projects:** treat `3d-config.ts` as the authoring surface. Tune cameras in Leva during dev, then copy values into config. Or script an export from Sanity if you have Studio access.

### What broke when CMS was stripped

| Failure | Root cause | Fix |
|---------|------------|-----|
| All cameras at origin / FOV 60 | `scenes: null` or empty array from placeholder | Export full `scenesConfig` singleton from Sanity production |
| Inspectables with empty titles | `inspectables: null` | Export `inspectablesConfig`; IDs must match `INSPECTABLES_META` |
| Silent empty copy | ID mismatch between manifest and config | One-time `console.warn` per missing id in `fetch-assets-local.ts` |
| Physics minigame wrong | `physics: null` | Export `physicsConfig` or hardcode defaults |

The upstream export comment references Sanity project `9syto90m / production`. Without that export, the site renders but 3D framing is wrong.

### Merge contract (`fetch-assets-local.ts`)

**Manifest owns:** URLs, mesh names, offsets, fx paths, bake mesh lists.

**Config owns:** human copy (titles, specs, PortableText descriptions), camera numbers, postprocessing, tab labels/routes.

Join key for inspectables: `meta.id === content.inspectableId`.

Camera field mapping:

```ts
position: [posX, posY, posZ]
target: [tarX, tarY, tarZ]
fov, targetScrollY, offsetMultiplier
```

Defaults when missing: position/target `0`, `fov: 60`, `targetScrollY: -1.5`, `offsetMultiplier: 1`.

## Asset manifest rules

From `src/lib/3d-config/README.md`:

1. Files live at `public/3d/<category>/<name>-<sha8>.<ext>`.
2. Every URL in `asset-manifest.ts` must resolve on disk.
3. `next.config` serves `/3d/*` with `Cache-Control: immutable, max-age=31536000`.
4. **Changing file content without changing URL = stale assets for up to a year.**

Commands in reference repo:

```bash
pnpm assets:hash public/3d/models/office.glb   # rename + print URL
pnpm assets:verify                            # manifest ↔ disk audit
```

## Fly mode default

`camera-controller.tsx`:

```ts
useControls("camera", {
  flyMode: { value: false, onChange: setIsFlyMode }
})
if (isFlyMode) return <WasdControls />
return <CustomCamera />
```

**Pitfall:** Leva panel open in dev with fly mode toggled — confusing for QA. Gate entire Leva behind `process.env.NODE_ENV === "development"` or a `?debug` query param for production builds.

## .next cache

After any manifest URL change:

```bash
rm -rf .next
pnpm dev
```

Hard-refresh browser. Turbopack/webpack may cache old GLB paths during dev.

## HTML layout overlap (most common scaffold bug)

Symptoms: two headlines at the same spot ("Stones…" + "The courtyard…"), MOBILE/DESKTOP/ROUTES cards on top of h1, unreadable text, z-index chaos.

| Cause | Fix |
|-------|-----|
| `layout-container` missing `lg:mt-[100dvh]` | Add margin when canvas visible — pushes HTML below fixed viewport |
| Hero copy in `absolute`/`fixed` overlay **and** Intro section | Remove overlay; one Intro in document flow |
| Field notes / spec cards at viewport origin | Move to section after Intro or sidebar grid column |
| Two `<h1>` on same route | One h1; field notes title is `<h2>` in lower section |

Full patterns and anti-patterns: [html-layout.md](html-layout.md).

## Canvas visibility blacklist

`content-wrapper.tsx` hides canvas on:

- `/showcase/:id`, `/post/:slug`, `/contact`, `/webby`, `/careers/:slug`

404 still needs canvas (`isNotFound` → show canvas even on blacklisted patterns).

## Touch vs pointer

```ts
const isTouchOnly =
  ("ontouchstart" in window || navigator.maxTouchPoints > 0) &&
  matchMedia("(pointer: coarse)").matches &&
  !matchMedia("(pointer: fine)").matches

className={cn(isTouchOnly && !isBasketball && "!pointer-events-none")}
```

Without this, mobile users cannot scroll past the hero.

## Scene-specific layout overrides

```tsx
(scene === "basketball" || scene === "lab" || scene === "404") && "h-[100svh]"
```

These routes use full viewport height instead of `80svh` mobile default.

## Adding a new route/scene

1. Add `sceneName` entry to `3d-config.ts` with `cameraConfig` + `postprocessing`.
2. Ensure `NavigationHandler` can resolve pathname → that `sceneName`.
3. If 3D hotspots needed: add tab entries + matching meshes in `routingElements.glb`.
4. If inspectables: add `INSPECTABLES_META` + matching `inspectableId` in config.
5. Test camera transition from `home` and back.

## Home scene reference values

From production export (`sceneName: "home"`):

```
fov: 64.65
offsetMultiplier: 0.25
position: [6.26, 1.16, -7.57]
target: [5.93, 1.29, -8.51]
targetScrollY: -0.1
postprocessing.bloomStrength: 0.15
postprocessing.brightness: 0.31
postprocessing.exposure: 0.54
```

Use as starting point when authoring a similar wireframe office hero.
