---
name: tauri-macos-window-drag
description: >-
  Diagnose and fix Tauri v2 macOS titlebar and window dragging without breaking
  native traffic lights or making the whole app draggable. Use this skill whenever
  a Tauri app will not drag, drags from its entire surface, still shows the app name
  in the titlebar, loses close/minimize/zoom controls, uses TitleBarStyle Overlay or
  Transparent, uses hiddenTitle or hidden_title, has data-tauri-drag-region or
  startDragging problems, or needs a production macOS custom titlebar copied from a
  known-good app. Also use it when drag works in some toolbar areas but not blank gaps.
compatibility: Tauri v2 on macOS with a Rust backend and any web frontend. Requires repository and shell access.
---

# Tauri macOS window drag

Build one boring contract: hide native title text, keep native titlebar behavior and
traffic lights, and let only deliberate blank chrome drag the window.

## Understand the three layers

Dragging crosses three independent layers. Trace all three before editing:

1. **Native window:** decorations, titlebar style, hidden title, transparency, window label.
2. **Webview hit regions:** which exact DOM elements carry `data-tauri-drag-region`.
3. **Tauri ACL:** whether `start_dragging` is allowed for that exact window label and the
   capability is active.

One broken layer makes correct-looking markup fail silently.

## Workflow

1. Read repository rules and any window/titlebar design document first.
2. Inspect `git status`; preserve unrelated dirty work.
3. Find the exact normal window builder, window label, frontend entry, toolbar markup,
   CSS, and capability files. Do not confuse a normal window with an `NSPanel`, popover,
   overlay, or tray window.
4. Search every existing drag mechanism before changing one:
   `data-tauri-drag-region`, `startDragging`, `start_dragging`,
   `setMovableByWindowBackground`, `decorations`, `hidden_title`, `hiddenTitle`, and
   `title_bar_style`.
5. Check the locked Tauri version. When behavior is unclear, inspect its bundled
   `src/window/scripts/drag.js` or official matching-version docs instead of guessing.
6. Fix native configuration, DOM regions, and ACL as one contract.
7. Restart the native app. HMR alone cannot reload Rust builder or capability changes.

## Native macOS contract

For a normal window with native traffic lights:

```rust
WebviewWindowBuilder::new(handle, "main", WebviewUrl::App("index.html".into()))
    .title("ProductName")
    .resizable(true)
    .transparent(true)
    .title_bar_style(tauri::TitleBarStyle::Overlay)
    .hidden_title(true);
```

- Keep decorations enabled; builder default is enough unless local code changes it.
- `hidden_title(true)` hides only centered app-name text.
- `TitleBarStyle::Overlay` keeps native close, minimize, zoom, fullscreen, and resize.
- Do not switch to `Transparent` or `decorations(false)` when native controls must remain.
- Use `traffic_light_position(...)` only when layout needs it; keep one position source.
- If window is transparent for compositing, paint an opaque web background unless glass
  is intentional.
- Gate macOS-only APIs with `#[cfg(target_os = "macos")]` when app is cross-platform.

## Webview drag regions

Use self-only drag regions. Current Tauri v2 interprets bare, empty, or `"true"` as
direct-click-only; `"deep"` includes descendants; `"false"` blocks drag.

React pattern:

```tsx
<header className="desktop-toolbar" data-tauri-drag-region="">
  <div className="traffic-light-clearance" data-tauri-drag-region="" />
  <button type="button" data-tauri-drag-region="false">Toggle sidebar</button>
  <div className="page-title">Today</div>
  <div className="toolbar-spacer" data-tauri-drag-region="" />
</header>
<main data-tauri-drag-region="false">...</main>
```

Why this shape works:

- Direct clicks on header gaps drag because header itself is self-only.
- Explicit blank spacers drag.
- Button stays clickable.
- Title text stays selectable/non-draggable.
- Main content never inherits drag behavior.

Do not put `"deep"` on a toolbar containing controls. Do not add
`setMovableByWindowBackground(true)`; AppKit then treats the whole background as window
chrome. Do not add global mouse handlers or manual `startDragging()` until markup and ACL
are proven correct.

Drag spacers must receive pointer events. A spacer with `pointer-events: none` sends the
click to an unmarked ancestor and appears dead.

## Capability contract

Grant only the needed operation to the exact label:

```json
{
  "identifier": "main-window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-start-dragging"
  ]
}
```

Then verify activation. If `tauri.conf.json` has an explicit
`app.security.capabilities` list, include `"main-window"`. Creating the capability file
without activating it leaves dragging disabled. Alternatively, add the label and permission
to an already-active capability; do not maintain both routes without need.

## Fast diagnosis

- **App name still visible:** `hidden_title(true)` missing or applied to another builder.
- **Titlebar or traffic lights gone:** decorations disabled or wrong titlebar style.
- **Drag attributes do nothing:** wrong window label, missing permission, or capability not active.
- **Whole app drags:** AppKit background dragging or a `"deep"` ancestor.
- **Toolbar gaps do not drag:** header lacks a self-only region.
- **Button drags instead of clicking:** deep ancestor or missing `"false"` on control.
- **Spacer does not drag:** pointer events disabled or attribute sits on wrong element.
- **Code changed but behavior did not:** native process was not restarted.

## Validation

Leave one DOM test asserting:

- toolbar and explicit spacers have self-only drag attributes;
- controls and body have `"false"`;
- no content ancestor has `"deep"`.

Then run the smallest repository-valid gates: focused UI test, TypeScript check, Rust/Tauri
check, formatting/diff check, and any required denied-warning Clippy command.

Final runtime check must use the real macOS binary:

- native title text hidden;
- traffic lights work;
- blank toolbar gaps and spacers drag;
- buttons, title text, inputs, sidebar rows, and content do not drag;
- native edges resize without jitter;
- behavior survives minimize, fullscreen, exit-fullscreen, and reopen;
- no separate gray strip appears above the webview.

## Reference-code safety

Study permissive or copyleft projects for architecture, but copy behavior through public Tauri
APIs instead of pasting licensed source. A tiny declarative implementation is easier to audit
and avoids license contamination.

## Report

Return four short items: root cause, exact files changed, checks run, and any real-binary step
still unverified. Never claim runtime drag success from DOM tests alone.
