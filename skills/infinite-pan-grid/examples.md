# Infinite Pan Grid — Examples

## Minimal React (Vite / CRA)

```tsx
// App.tsx
import InfinitePanGrid from "./components/InfinitePanGrid";

const ITEMS = [
  { id: "1", name: "Tool A", image: "/a.png" },
  { id: "2", name: "Tool B", image: "/b.png" },
];

export default function App() {
  return (
    <div className="relative h-dvh w-dvw">
      <InfinitePanGrid
        items={ITEMS}
        getItemKey={(i) => i.id}
        getItemImage={(i) => i.image}
        animationType="polkadot"
        onCellClick={({ item }) => console.log(item)}
      />
    </div>
  );
}
```

```css
/* index.css */
html, body { overflow: hidden; height: 100dvh; margin: 0; }
```

---

## Next.js App Router

### `app/globals.css`

```css
html, body {
  overflow: hidden;
  height: 100dvh;
  margin: 0;
}

.infinite-grid-canvas {
  overflow: hidden;
  touch-action: none;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.infinite-grid-canvas::-webkit-scrollbar { display: none; }
```

### `app/layout.tsx`

```tsx
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="overflow-hidden h-dvh">{children}</body>
    </html>
  );
}
```

### `app/page.tsx` — server fetch, client grid

```tsx
import { InfinitePanGrid } from "@/components/InfinitePanGrid";
import { getTools } from "@/lib/tools";

export default async function HomePage() {
  const tools = await getTools();
  return (
    <main className="relative h-dvh w-dvw">
      <InfinitePanGrid
        items={tools}
        getItemKey={(t) => t.id}
        getItemImage={(t) => t.image_link}
        getItemLabel={(t) => t.name}
        animationType="polkadot"
      />
    </main>
  );
}
```

If grid uses hooks/events, wrap client boundary:

```tsx
// app/HomeGrid.tsx
"use client";

import { InfinitePanGrid } from "@/components/InfinitePanGrid";
import type { Tool } from "@/lib/types";

export function HomeGrid({ tools }: { tools: Tool[] }) {
  return (
    <InfinitePanGrid
      items={tools}
      getItemKey={(t) => t.id!}
      getItemImage={(t) => t.image_link}
      animationType="polkadot"
    />
  );
}
```

```tsx
// app/page.tsx
import { getTools } from "@/lib/tools";
import { HomeGrid } from "./HomeGrid";

export default async function Page() {
  const tools = await getTools();
  return <HomeGrid tools={tools} />;
}
```

---

## With search + category filter (HomePage pattern)

```tsx
"use client";

import { useState } from "react";
import { InfinitePanGrid } from "@/components/InfinitePanGrid";
import { SearchBar } from "@/components/SearchBar";
import { ToolModal } from "@/components/ToolModal";

export function HomePage({ tools }: { tools: Tool[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<CellClick | null>(null);

  const filtered =
    category === "all"
      ? tools
      : tools.filter((t) => t.category?.toLowerCase() === category);

  return (
    <div className="relative h-dvh w-dvw">
      <div className="absolute top-6 left-6 right-6 z-10">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <InfinitePanGrid
        items={filtered}
        searchQuery={searchQuery}
        getItemKey={(t) => t.id!}
        getItemImage={(t) => t.image_link}
        animationType="polkadot"
        onCellClick={setSelected}
      />

      {selected && (
        <ToolModal data={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
```

Pass `searchQuery` into grid; filter inside grid or pre-filter in page — both work. Reset animations when filter changes.

---

## Extracted utils (`lib/infiniteGridUtils.ts`)

```ts
export const CELL_SIZE = 200;
export const PADDING_X = 80;
export const PADDING_Y = 80;
export const STRIDE_X = CELL_SIZE + PADDING_X;
export const STRIDE_Y = CELL_SIZE + PADDING_Y;
export const OVERSCAN = 2;

export function positiveMod(n: number, mod: number) {
  return ((n % mod) + mod) % mod;
}

export interface GridBounds {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

export function computeBounds(
  scrollX: number,
  scrollY: number,
  width: number,
  height: number,
): GridBounds {
  return {
    startCol: Math.floor(scrollX / STRIDE_X) - OVERSCAN,
    endCol: Math.ceil((scrollX + width) / STRIDE_X) + OVERSCAN,
    startRow: Math.floor(scrollY / STRIDE_Y) - OVERSCAN,
    endRow: Math.ceil((scrollY + height) / STRIDE_Y) + OVERSCAN,
  };
}

export function boundsEqual(a: GridBounds, b: GridBounds) {
  return (
    a.startRow === b.startRow &&
    a.endRow === b.endRow &&
    a.startCol === b.startCol &&
    a.endCol === b.endCol
  );
}

export function cellIndex(row: number, col: number, count: number) {
  return positiveMod(row * 97 + col * 31, count);
}
```

---

## Generic cell click type

```ts
export interface CellClick<T> {
  row: number;
  col: number;
  item: T;
  imageUrl: string;
}
```

---

## Debugging perf regressions

If pan feels laggy again, check in order:

1. Is `setState` called inside rAF pan loop? → move to ref + DOM
2. Is `transition: all` on cells? → restrict to pop-in props
3. Is lerp/smoothing on wheel? → remove, use direct delta
4. Is native scroll still present? → switch to transform pan
5. Are cell positions recalculated from scroll in JSX each frame? → fixed world coords + world transform
