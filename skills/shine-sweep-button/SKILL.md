---
name: shine-sweep-button
description: >-
  Add a glistening light-sweep (shine/glint/glisten/specular streak) that
  slides across a button or card on hover. Use this whenever the user wants a
  button to "shine", "glisten", "glint", "shimmer", "have a light sweep", "have
  a glossy hover", or asks for that premium SaaS landing-page button effect
  where a diagonal band of light glides over the surface on mouseover — even if
  they describe it loosely ("make the button feel shiny on hover", "add that
  moving glare thing"). Works with CSS Modules, plain CSS, Tailwind, or
  styled-components.
---

# Shine sweep on hover

A diagonal band of light that glides across a button when the pointer enters,
and glides back out the same way when it leaves. The trick that makes it feel
premium (not cheap) is restraint: a *narrow*, *soft* streak, a *symmetric*
in/out timing, and **no element movement** — the button itself stays put, only
the light moves.

## How it works

A pseudo-element (`::after`) holds the light. It's a skewed, semi-transparent
white gradient parked off the left edge. On hover, you change a single property
— `left` — and let a CSS `transition` animate the slide. Because the transition
lives on the base pseudo-element, the streak animates *back* when the user
un-hovers too, at whatever duration the base rule specifies. Matching the base
duration to the hover duration is what makes entry and exit feel equal.

Why `transition` and not `@keyframes`: a keyframe animation only plays on
hover-in, so the streak vanishes instantly on hover-out. A transition animates
both directions, which reads as one smooth object passing through.

The host element needs `position: relative` and `overflow: hidden` so the
streak is clipped to the button's shape.

## Canonical recipe (CSS Modules / plain CSS)

```css
.btn {
  position: relative;
  overflow: hidden;
}

.btn::after {
  content: "";
  position: absolute;
  top: 0;
  left: -130%;            /* parked off the left edge */
  width: 28%;             /* narrow band — see tuning */
  height: 100%;
  background: linear-gradient(
    100deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.55) 50%,   /* peak brightness — see tuning */
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-18deg);  /* diagonal slant */
  pointer-events: none;
  transition: left 1.1s ease;   /* exit speed = entry speed */
}

.btn:hover::after {
  left: 130%;             /* sweeps off the right edge */
}
```

That's the whole effect. Everything else is tuning.

## Tuning knobs

Adjust these to taste; the defaults above are a calm, classy starting point.

- **Speed** — the `transition` duration on `.btn::after`. ~1.1s reads as slow and
  premium; 0.5–0.7s reads as snappy/energetic. Keep the base rule and the
  `:hover` rule at the same duration so in and out match. If the user wants
  asymmetric timing, put a different `transition` inside `:hover::after`.
- **Width** — the `width` of the streak. ~24–30% is a thin glint; 60%+ is a
  broad wash of light. Narrow usually looks more expensive.
- **Brightness** — the middle `rgba` alpha (0.55 here). Lower for subtle, higher
  for a hard specular flash. On dark buttons white works; on light or colored
  buttons, tint the streak toward the surface color instead of pure white so it
  doesn't look like a gray smear.
- **Slant** — `skewX(-18deg)`. More skew = more diagonal; `0deg` = a vertical
  bar of light.

## Important: don't add motion

A frequent mistake is pairing the shine with a `transform: translateY(-2px)`
lift on hover. The shine already signals interactivity; adding a lift makes the
button feel busy. Unless the user explicitly asks for the button to move, keep
hover to the shine (plus optionally a shadow/background tweak) and leave
position alone.

## Adapting to other styling systems

The mechanism is identical everywhere — a clipped, skewed gradient pseudo-element
whose `left` transitions on hover. Only the syntax changes:

- **Tailwind**: put the streak in a `before:`/`after:` arbitrary-variant utility,
  or drop a `<span>` overlay and animate it; Tailwind's `group-hover:` lets the
  parent's hover drive the child. A small custom CSS block is often cleaner than
  cramming the gradient into arbitrary values.
- **styled-components / emotion**: same CSS inside the `&::after { }` /
  `&:hover::after { }` nesting.
- **No pseudo-element available** (e.g. some component libs): use a real
  absolutely-positioned `<span>` child with the same gradient and transition.

## Example outcomes

**Example 1**
Request: "make the Subscribe button glisten when I hover it"
Apply the canonical recipe to the button's class, defaults as-is.

**Example 2**
Request: "add a fast shimmer sweep to my CTA, and it should be a wide bright flash"
Set `transition: left 0.55s ease` (both rules), `width: 60%`, middle alpha `0.7`.

**Example 3**
Request: "shiny hover on my blue gradient button but don't make it jump"
Apply the recipe; tint the streak toward light blue (e.g.
`rgba(150, 190, 255, 0.5)`) instead of white; confirm there's no `translate`/lift
in the hover rule.
