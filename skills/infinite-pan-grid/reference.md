# Infinite Pan Grid — Reference

## Source of truth

| File | Role |
|------|------|
| `src/InfiniteGrid.tsx` | Grid component (~567 lines) |
| `src/index.css` | `.infinite-grid-canvas` scrollbar hiding |
| `index.html` | `body { overflow: hidden }` scroll lock |
| `src/pages/HomePage.tsx` | Consumer: props, modal, overlay UI |

## Architecture diagram

```
┌─────────────────────────────────────────────────────────┐
│ HomePage / Page                                          │
│  searchQuery, selectedCategory ──► InfiniteGrid props   │
│  onImageClick ──► Modal                                   │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│ parentRef (.infinite-grid-canvas)                        │
│   overflow: hidden | touch-action: none | grab cursor    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ worldRef — translate3d(-scrollX, -scrollY, 0)     │ │
│ │   GridCell[row,col] × visible window                │ │
│ │   absolute: left=col*STRIDE+PAD/2, top=row*STRIDE   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

Hot path (every pan frame):
  wheel/drag → scrollRef += delta → rAF → world.style.transform

Cold path (cell boundary crossed):
  computeBounds → boundsEqual? skip : setGridBounds → visibleCells → mount/unmount
```

## Ref inventory

| Ref | Purpose |
|-----|---------|
| `scrollRef` | `{ x, y }` pan offset in px, unbounded |
| `worldRef` | DOM node for GPU transform |
| `parentRef` | Viewport + event target |
| `viewportRef` | Mirror of viewport size for handlers |
| `boundsRef` | Mirror of gridBounds to avoid stale closure |
| `animatedCellsRef` | Mirror of animated Set for effect reads |
| `rafRef` | Coalesced animation frame id |
| `timeoutsRef` | Map of cellKey → stagger timeout |
| `dragRef` | Pointer drag state |

## Key functions

### computeBounds

```ts
function computeBounds(scrollX, scrollY, width, height): GridBounds {
  return {
    startCol: Math.floor(scrollX / STRIDE_X) - OVERSCAN,
    endCol:   Math.ceil((scrollX + width) / STRIDE_X) + OVERSCAN,
    startRow: Math.floor(scrollY / STRIDE_Y) - OVERSCAN,
    endRow:   Math.ceil((scrollY + height) / STRIDE_Y) + OVERSCAN,
  };
}
```

### applyTransform

```ts
world.style.transform = `translate3d(${-scrollRef.current.x}px, ${-scrollRef.current.y}px, 0)`;
```

### syncGridBounds

```ts
const next = computeBounds(scrollRef.current.x, scrollRef.current.y, width, height);
if (boundsEqual(boundsRef.current, next)) return;
boundsRef.current = next;
setGridBounds(next);
```

### schedulePanUpdate

```ts
if (rafRef.current !== null) return;
rafRef.current = requestAnimationFrame(() => {
  rafRef.current = null;
  applyTransform();
  syncGridBounds();
});
```

## Input handlers

```ts
// Wheel — trackpad 1:1, no lerp
container.addEventListener("wheel", (e) => {
  e.preventDefault();
  scrollRef.current.x += e.deltaX;
  scrollRef.current.y += e.deltaY;
  schedulePanUpdate();
}, { passive: false });

// Drag — inverted delta (grab world)
panBy(-(clientX - lastX), -(clientY - lastY));
container.setPointerCapture(pointerId);
```

## GridCell styling

```tsx
style={{
  position: "absolute",
  left: col * STRIDE_X + PADDING_X / 2,
  top: row * STRIDE_Y + PADDING_Y / 2,
  width: CELL_SIZE,
  height: CELL_SIZE,
  transform: `scale(${isAnimated ? 1 : 0})`,
  opacity: isAnimated ? 1 : 0,
  filter: isAnimated ? "blur(0px)" : "blur(8px)",
  transition: "transform 0.6s ..., opacity 0.6s ..., filter 0.6s ...",
  willChange: isAnimated ? "auto" : "transform, opacity, filter",
}}
```

## Animation effect pattern

```ts
React.useEffect(() => {
  const cellsToAnimate = [...visibleCellKeys].filter(
    (key) => !timeoutsRef.current.has(key) && !animatedCellsRef.current.has(key),
  );
  if (!cellsToAnimate.length) return;
  // schedule timeouts → setAnimatedCells
}, [visibleCellKeys, animationType]); // NOT animatedCells in deps

React.useEffect(() => {
  setAnimatedCells(new Set());
}, [items.length, filterKey]);
```

## CSS (full)

```css
/* Page scroll lock */
html, body {
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
}

/* Canvas — no scrollbars ever */
.infinite-grid-canvas {
  overflow: hidden;
  touch-action: none;
  user-select: none;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.infinite-grid-canvas::-webkit-scrollbar {
  display: none;
}
```

Tailwind equivalent on canvas: `overflow-hidden select-none` + class `infinite-grid-canvas`.

## Props interface (toolss)

```ts
interface InfiniteGridProps {
  onImageClick?: (data: { url: string; row: number; col: number; tool?: Tool }) => void;
  animationType?: "default" | "polkadot" | "disabled";
  disableCustomScroll?: boolean;
  selectedCategory?: string;
  searchQuery?: string;
}
```

Internal: fetches Supabase `tools` table. For reuse, extract `items` prop instead.

## Dependencies

| Package | Required? |
|---------|-----------|
| `react` | Yes |
| `@supabase/supabase-js` | Only if fetching inside grid |
| `@tanstack/react-virtual` | **No** — removed in rewrite |
| `hammerjs` | **No** — unused |

## Git evolution (lessons)

| Era | Approach | Problem |
|-----|----------|---------|
| v1 (`8013aeb`) | TanStack Virtual + `overflow: auto` | One-direction growth, scrollbars, diagonal lag |
| v2 (session) | Transform + `setFrame()` React re-render | Lag, jitter, snap |
| v3 (`dec5904`) | GPU world layer + bounds-gated React | Current — smooth |

Commit `b45c0db`: animation stagger 8ms → 15ms reduced pop-in jank.

## Scrollbar fix summary

Problem: native `overflow: auto` shows scrollbars and clamps to `[0, scrollWidth]`.

Fix stack:
1. `overflow: hidden` on canvas (no scroll container)
2. Pan via `translate3d` on world layer
3. Defensive scrollbar CSS on `.infinite-grid-canvas`
4. `html, body { overflow: hidden }` so page doesn't steal wheel events

## Performance budget

During pan inside same cell indices:
- **0** React re-renders from bounds
- **1** DOM write per rAF (`transform`)
- **~N** visible cells where N � `(cols in view + 2*OVERSCAN) * (rows in view + 2*OVERSCAN)`

Typical N: 20–80 cells.

## Full-fidelity appendix (toolss parity)

Use when remaking `InfiniteGrid.tsx` exactly, not just the pan pattern.

### Initial state

```ts
const [gridBounds, setGridBounds] = useState({
  startRow: -OVERSCAN, endRow: OVERSCAN,
  startCol: -OVERSCAN, endCol: OVERSCAN,
});
const scrollRef = useRef({ x: 0, y: 0 });
```

### Polkadot sort (exact)

```ts
const centerRow = Math.floor(y / STRIDE_Y) + Math.floor(height / STRIDE_Y / 2);
const centerCol = Math.floor(x / STRIDE_X) + Math.floor(width / STRIDE_X / 2);

cellsToAnimate.sort((a, b) => {
  const [aRow, aCol] = a.split("-").map(Number);
  const [bRow, bCol] = b.split("-").map(Number);
  const aDist = Math.abs(aRow - centerRow) + Math.abs(aCol - centerCol);
  const bDist = Math.abs(bRow - centerRow) + Math.abs(bCol - centerCol);
  const aRandom = (aRow * 13 + aCol * 17) % 7;  // deterministic jitter
  const bRandom = (bRow * 13 + bCol * 17) % 7;
  return aDist + aRandom - (bDist + bRandom);
});
// delay: index * 30 + Math.random() * 15
```

Default mode delay: `index * 15`.

### Exact transition curves

```ts
// default — 0.6s
"transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1), opacity 0.6s cubic-bezier(0.175, 0.885, 0.32, 1), filter 0.6s cubic-bezier(0.175, 0.885, 0.32, 1)"

// polkadot — 0.3s bouncy
"transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), filter 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)"
```

### Animation lifecycle

```ts
// Clear timeouts for cells that left visible window
currentTimeouts.forEach((timeout, cellKey) => {
  if (!visibleCellKeys.has(cellKey)) { clearTimeout(timeout); currentTimeouts.delete(cellKey); }
});

// Reset all pop-in state when filters change
useEffect(() => { setAnimatedCells(new Set()); }, [filteredTools.length, selectedCategory, searchQuery]);

// Unmount: clear timeouts + cancelAnimationFrame(rafRef.current)
```

### Input edge cases

- Drag: `if (event.button !== 0) return` (left click only)
- Register `pointercancel` same as `pointerup`
- `isDragging` state → cursor `grab` / `grabbing`

### Vite scroll lock (`index.html`)

```html
<body class="fixed! overflow-hidden! w-[100dvw]! h-[100dvh]! overscroll-none! min-w-0! min-h-0! m-0!">
```

Stronger than CSS-only — prevents rubber-band on mobile.

### Supabase fetch (internal pattern)

```ts
useEffect(() => {
  supabase.from("tools").select("*").order("created_at", { ascending: false })
    .then(({ data }) => setTools(data ?? []));
}, []);
```

While `isLoading`, `getToolForCell` returns `null` → no cells rendered.

### Client-side filter

```ts
// category (skip when "all")
tool.category?.toLowerCase() === selectedCategory.toLowerCase()

// search
name.includes(q) || description?.includes(q) || tags?.some(t => t.includes(q))
```

### Dark mode

```ts
useEffect(() => {
  const obs = new MutationObserver(() =>
    setIsDarkMode(document.documentElement.classList.contains("dark")));
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}, []);
// canvas bg: dark #000000, light #FAFAFA
```

### Overlays

| State | UI |
|-------|-----|
| `isLoading` | Centered spinner + "Loading tools…", `z-20`, `pointer-events-none` |
| `!isLoading && items.length === 0` | Empty copy (search vs category), CTA → `/submit` |

### Cell chrome

```ts
borderRadius: 8
boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
img: pointerEvents: "none", draggable: false, loading: "lazy"
world layer: position: "absolute", inset: 0, willChange: "transform"
outer shell: h-dvh w-dvw flex justify-center items-center
```

### Callback shape (toolss)

```ts
onImageClick?: (data: { url: string; row: number; col: number; tool?: Tool }) => void
```

## Remake file structure

```
components/
  InfinitePanGrid.tsx      # generic grid (client)
  InfinitePanGridCell.tsx  # memoized cell (optional split)
lib/
  infiniteGridUtils.ts     # positiveMod, computeBounds, boundsEqual
styles/
  infinite-grid.css        # canvas + scroll lock
```

Next.js App Router:

```
app/
  layout.tsx               # body overflow hidden
  globals.css              # scroll lock + .infinite-grid-canvas
  page.tsx                 # server fetch → client grid
  InfinitePanGrid.tsx      # "use client"
```
