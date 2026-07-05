---
name: infinite-pan-grid
description: Builds smooth bidirectional infinite 2D pan grids in React and Next.js using GPU transform panning, manual viewport culling, and no native scrollbars. Use when implementing infinite canvas grids, panning tile layouts, image walls, tool directories, or fixing laggy/jittery/snap scroll in 2D virtual grids.
---

# Infinite Pan Grid

Build a **true infinite 2D pan grid** — unbounded in all directions, no scrollbars, smooth wheel + drag.

Reference implementation: `toolss` repo `src/InfiniteGrid.tsx` (commit `dec5904+`).

## When to use

- Infinite canvas / tile wall / image grid that pans in every direction
- User reports lag, jitter, snap, visible scrollbars, or "starting scroll" edges
- Replacing TanStack Virtual + `overflow: auto` for 2D infinite layouts

## When NOT to use

- 1D lists → use TanStack Virtual or native list virtualization
- Finite bounded grids with scroll-to-end pagination → native scroll or virtual list is fine
- Map with geo coordinates → use a map library

## Core architecture (non-negotiable)

```
viewport (overflow: hidden, touch-action: none)
└── world layer (translate3d(-scrollX, -scrollY, 0))  ← GPU pan, updated in rAF
    └── cells (absolute world coords: col*STRIDE, row*STRIDE)
```

| Layer | Storage | Updates when |
|-------|---------|--------------|
| Pan offset | `scrollRef` (ref) | Every wheel/drag event |
| Visual motion | `worldRef.style.transform` | Every rAF (no React) |
| Visible cells | React state `gridBounds` | Only when cell index window changes |
| Cell pop-in | React state `animatedCells` | New cells enter bounds |

**Rule:** motion in refs + DOM. React only for topology changes.

## Implementation workflow

Copy this checklist and track progress:

```
Remake checklist:
- [ ] 1. Constants: CELL_SIZE, PADDING, STRIDE, OVERSCAN
- [ ] 2. positiveMod + cell hash for content mapping
- [ ] 3. computeBounds + boundsEqual guard
- [ ] 4. Viewport ref + ResizeObserver
- [ ] 5. applyTransform (translate3d on world layer)
- [ ] 6. schedulePanUpdate (coalesced rAF)
- [ ] 7. Wheel + pointer drag handlers
- [ ] 8. Memoized GridCell with pop-in transitions only
- [ ] 9. Page scroll lock CSS
- [ ] 10. Verify no lag/jitter (see Anti-patterns)
```

### Step 1 — Constants

```ts
const CELL_SIZE = 200;
const PADDING_X = 80;
const PADDING_Y = 80;
const STRIDE_X = CELL_SIZE + PADDING_X;
const STRIDE_Y = CELL_SIZE + PADDING_Y;
const OVERSCAN = 2;
```

Cell world position (never changes during pan):

```ts
left: col * STRIDE_X + PADDING_X / 2
top:  row * STRIDE_Y + PADDING_Y / 2
```

### Step 2 — Infinite content addressing

Map `(row, col)` → item without storing per-cell data:

```ts
function positiveMod(n: number, mod: number) {
  return ((n % mod) + mod) % mod;
}

const index = positiveMod(row * 97 + col * 31, items.length);
```

`positiveMod` is **required** for negative row/col when panning up/left.

### Step 3 — Viewport culling

```ts
function computeBounds(scrollX, scrollY, width, height) {
  return {
    startCol: Math.floor(scrollX / STRIDE_X) - OVERSCAN,
    endCol:   Math.ceil((scrollX + width) / STRIDE_X) + OVERSCAN,
    startRow: Math.floor(scrollY / STRIDE_Y) - OVERSCAN,
    endRow:   Math.ceil((scrollY + height) / STRIDE_Y) + OVERSCAN,
  };
}
```

Only call `setGridBounds` when `boundsEqual(prev, next)` is false.

### Step 4 — Pan hot path

```ts
const panBy = (dx: number, dy: number) => {
  scrollRef.current.x += dx;
  scrollRef.current.y += dy;
  schedulePanUpdate();
};

// rAF coalesced — max one frame callback per burst
const schedulePanUpdate = () => {
  if (rafRef.current !== null) return;
  rafRef.current = requestAnimationFrame(() => {
    rafRef.current = null;
    worldRef.current!.style.transform =
      `translate3d(${-scrollRef.current.x}px, ${-scrollRef.current.y}px, 0)`;
    syncGridBounds(); // setState only if bounds changed
  });
};
```

Wheel: `preventDefault` + `{ passive: false }` + direct delta (no lerp).

Drag: pointer capture, `panBy(-deltaX, -deltaY)` (grab-world semantics).

### Step 5 — GridCell

- `React.memo` each cell
- Pop-in: `scale(0→1)`, `opacity`, `blur` — **never animate `left`/`top`**
- Transitions: `transform, opacity, filter` only — **never `transition: all`**
- `willChange: "transform"` on world layer; on cells only while animating in
- Block click until `isAnimated` (avoid mid-pop-in clicks)

### Step 6 — CSS prerequisites

Viewport canvas:

```css
.infinite-grid-canvas {
  overflow: hidden;
  touch-action: none;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.infinite-grid-canvas::-webkit-scrollbar { display: none; }
```

Page scroll lock (required so wheel `preventDefault` works):

```css
html, body { overflow: hidden; height: 100dvh; }
```

Next.js: put scroll lock in `app/globals.css` or root layout.

### Step 7 — Generic props (decouple from data source)

```ts
interface InfinitePanGridProps<T> {
  items: T[];
  isLoading?: boolean;
  getItemKey: (item: T) => string;
  getItemImage: (item: T) => string;
  getItemLabel?: (item: T) => string;
  onCellClick?: (payload: { row: number; col: number; item: T }) => void;
  animationType?: "default" | "polkadot" | "disabled";
  filterItems?: (items: T[]) => T[];
}
```

Supabase/API fetch stays in page or server component; pass `items` down.

## Next.js specifics

1. **`"use client"`** on grid component — uses refs, DOM events, ResizeObserver
2. **No SSR for pan state** — initial render at scroll `(0,0)` is fine
3. **Data:** fetch in Server Component → pass serializable `items` to client grid, OR fetch in client `useEffect`
4. **Layout:** full-viewport wrapper `h-dvh w-dvh`; overlay UI at `z-10+`
5. **Images:** use `next/image` only if you add fixed `width/height`; plain `<img loading="lazy">` works for dynamic cell mounts

See [examples.md](examples.md) for App Router wiring.

## Anti-patterns (caused lag/jitter in toolss)

| Do NOT | Why | Do instead |
|--------|-----|------------|
| `overflow: auto` + scrollLeft/Top | Finite bounds, scrollbars, layout thrash | `overflow: hidden` + transform pan |
| TanStack Virtual for 2D infinite | Grows row/col counts one direction; scroll sync per frame | Manual `computeBounds` |
| `setState` every pan frame | 60fps full React tree | Ref + DOM transform |
| Lerp wheel + snap at 0.5px | Floaty + stutter on trackpad | Direct 1:1 delta |
| `transition: all` on cells | Animates position during pan | Explicit pop-in properties only |
| Per-cell left/top from scroll in JSX | Re-layout all cells each frame | Fixed world coords + world transform |
| Raw `%` for negative indices | Negative array index | `positiveMod` |
| `animatedCells` in effect deps | Re-triggers stagger on every pop-in | `animatedCellsRef` snapshot |

## Animation modes

| Mode | Stagger | Transition |
|------|---------|------------|
| `disabled` | instant batch | none |
| `default` | `index * 15ms` | 0.6s ease-out scale/opacity/blur |
| `polkadot` | sort by Manhattan dist from viewport center + jitter; `index * 30 + random(15)ms` | 0.3s bouncy cubic-bezier |

Reset `animatedCells` when filter/search/items change.

## Edge cases

- **`disableCustomScroll={true}`** disables all pan — no fallback; avoid unless static preview
- **Empty items:** render overlay, skip cells
- **Viewport 0×0:** skip bounds sync until ResizeObserver fires
- **Re-entering cell:** key `${row}-${col}` may skip re-animation if still in `animatedCells` Set
- **`loading="lazy"` + transform pan:** images may load later than native scroll — acceptable tradeoff
- **Fast pan + polkadot:** many timeouts — consider `disabled` during perf testing

## Verification (skill completeness test)

Before shipping, confirm you can remake the grid from this skill alone:

```
Architecture:
  [ ] Two-layer viewport + world transform
  [ ] scrollRef unbounded (negative values work)
  [ ] React re-render only on bounds change
  [ ] Initial gridBounds ±OVERSCAN

Performance:
  [ ] No setState in pan loop
  [ ] rAF coalescing
  [ ] React.memo cells
  [ ] No transition: all
  [ ] Unmount: cancel rAF + clear timeout map

Input:
  [ ] Wheel passive:false + preventDefault
  [ ] Pointer drag with capture (left button only)
  [ ] pointercancel handler
  [ ] touch-action: none

CSS:
  [ ] overflow: hidden on canvas
  [ ] scrollbar hiding rules
  [ ] body overflow hidden (+ fixed/overscroll-none for Vite)

Content:
  [ ] positiveMod hash (row*97 + col*31)
  [ ] OVERSCAN buffer
  [ ] Filter reset clears animations
  [ ] Timeout cleanup when cells leave bounds

Animation:
  [ ] Polkadot: Manhattan center sort + (row*13+col*17)%7 jitter
  [ ] Exact cubic-bezier curves (see reference appendix)
  [ ] Click blocked until isAnimated

Next.js / React:
  [ ] use client (Next.js)
  [ ] Page scroll lock in globals
  [ ] Generic items prop OR documented Supabase pattern
```

Full code patterns, file map, and git evolution: [reference.md](reference.md)

React + Next.js embed examples: [examples.md](examples.md)
