---
name: comfy-wave-loader
description: >-
  Build a masked-SVG wordmark loading animation — a logo or word that fills from
  the bottom up with an animated liquid wave (as seen on ComfyUI's splash screen).
  Use this whenever the user wants a branded loading/splash animation, a "logo that
  fills up like liquid", a wave/water fill text effect, a masked SVG wave, an
  animated wordmark loader, or asks how the Comfy loading screen works. Also use it
  when someone points at a wordmark that ripples/waves as it loads and wants to
  recreate or adapt it to their own logo. Works framework-agnostic (plain HTML+CSS)
  or as a Vue 3 component.
---

# Comfy wave loader

A loading animation where a **wordmark fills from the bottom up** with a rippling
liquid surface. It looks like text made of water rising to fill a glass.

## First, the question people always ask: what font is it?

**There is no font.** The wordmark is a single, pre-outlined SVG `<path>` — the
letters are baked into vector geometry, not rendered from a typeface. So you can't
"install the font." The rounded, soft, slightly-melting letterforms are a property
of that specific path, not of any installed family. The closest *vibe* is a rounded
soft-serif display face, but the asset itself is outlines.

Consequence: to use a **different word**, you must supply your own outlined path (see
"Adapting to your own word" below). You can't just change a text string.

## How the effect actually works

Three ingredients, stacked:

1. **A mask from the wordmark.** An SVG `<mask>` is defined from the wordmark path
   (white = visible). Everything drawn behind the mask only shows through the letter
   shapes. This is what confines the wave to the word.

2. **A wavy rectangle that rises (`rise-up`).** Behind the mask sits a tall filled
   shape whose *top edge is a row of ripples* (a chain of quadratic béziers), with a
   big solid body below it. A `translateY` animation lifts this whole shape from
   below the viewBox (`280px`, empty) to above it (`-80px`, full), over ~4s,
   `ease-in-out infinite alternate`. That upward travel is the "filling up".

3. **A ripple that scrolls sideways (`wave-move`).** The same wavy path also slides
   horizontally via a second `translateX` animation (~1.2s linear infinite). This is
   what makes the surface look like moving liquid rather than a flat line creeping up.

Optional 4th ingredient: a **faint outline** — a stroke-only copy of the wordmark at
`opacity 0.4` — so the letters are legible before the fill reaches them.

### The one non-obvious number: 880

The ripple path repeats every **880 user units** (wavelength of the `Q…T…T` chain),
and `wave-move` translates by exactly `-880px`. Matching the scroll distance to the
wavelength is what makes the horizontal loop **seamless** — after one cycle the wave
is pixel-identical, so there's no visible jump. If you change the ripple geometry,
change the `wave-move` distance to match the new wavelength or you'll get a stutter.

### Accessibility (keep this — it's not optional)

Wrap both animations in `@media (prefers-reduced-motion: reduce)` and, for users who
opt out of motion, disable the animation and show the **filled** state
(`translateY(-80px)`). A loader that respects reduced-motion is table stakes; don't
strip it. Also give the container `role="status"` and an accessible label so screen
readers announce "loading".

## Files in this skill

- `assets/demo.html` — a **standalone, framework-free** HTML+CSS+inline-SVG version.
  Open it in a browser to see the effect immediately. Parameterized with a
  `--wave-color` CSS variable and clearly-marked swap points for the viewBox and the
  wordmark path. This is the fastest thing to hand someone.
- `assets/comfy-path.txt` — the exact "comfy" wordmark path `d` string (viewBox
  `0 0 879 284`). Copy it verbatim if you want the original Comfy mark; replace it
  with your own if you're rebranding.
- `references/vue-component.md` — the Vue 3 SFC version with `size` / `color` /
  `bordered` / `disableAnimation` props. Read this when the target is a Vue app.

## How to use this skill

1. **Just want to see it / drop it into any site?** Copy `assets/demo.html` (or its
   `<span class="wave-loader">…</span>` + the `<style>` block). Set `--wave-color`
   and the SVG `height` to taste. Done.
2. **Vue project?** Follow `references/vue-component.md`.
3. **React / Svelte / anything else?** The technique is pure SVG+CSS. Port the
   `demo.html` markup into a component; the mask, the two keyframes, and the reduced-
   motion block carry over unchanged. Give the mask `id` a unique/generated value if
   more than one loader can appear on a page (duplicate mask IDs collide).

## Adapting to your own word or logo

1. **Outline your text.** In a vector editor (Figma, Illustrator, Inkscape), type
   your word in the face you like, then convert text → outlines / flatten to a single
   path. Export the `d` attribute. (Or use any existing logo path.)
2. **Set the viewBox to the path's bounds.** Use the exported bounding box as
   `viewBox="minX minY width height"` so the wordmark isn't cropped or off-center.
3. **Pick the rise range.** `rise-up` should travel from *just below* the wordmark to
   *just above* it: start ≈ `viewBox height + small margin`, end ≈ `-(margin)`. The
   Comfy values (`280` → `-80` for a `284`-tall viewBox) are a good ratio to copy.
4. **Match the wave-move distance to your ripple wavelength.** If you keep the
   provided ripple path, keep `-880px`. If you author a different ripple, set the
   `translateX` distance equal to one full wavelength so the loop stays seamless.
5. **Recolor** via `currentColor` / `--wave-color`. The mask fill and the wave both
   inherit it.

## Common pitfalls

- **Duplicate mask IDs.** Two loaders on one page sharing `id="wordmark"` will fight.
  Generate a unique id per instance (Vue's `useId()`, React's `useId()`, or a random
  suffix).
- **Wrong wave-move distance → visible jump.** See the "880" note above.
- **Wave overshoots or undershoots the letters.** Tune the `rise-up` start/end to
  your viewBox height, not the Comfy numbers, if your aspect ratio differs a lot.
- **Trying to change the word by editing a text string.** There's no text — you must
  swap the path (see adapting section).
