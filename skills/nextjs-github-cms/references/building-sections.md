# Building section components for a project's content shape

The backend engine is generic, but the **editor UI must match the project's
content model**. This is the part you tailor each time. The goal is the same
quality as the reference project: every field in the schema gets a real input
(not just a raw JSON blob).

## Step 1 — establish the content model (the schema)

The Zod `SiteContentSchema` in `src/data/schemas.ts` is the single source of
truth. Everything keys off it: validation on save, the TypeScript type the
editor uses, and what counts as "a field."

- **If the project already has content** (hardcoded in components, an existing
  JSON/TS file, scattered constants): inventory every piece of editable copy,
  list, image, and link. Group it into logical sections. Model each as Zod.
- **If it's greenfield**: start from `assets/data/schemas.starter.ts` and grow
  it.

Schema conventions that make the editor better:

- Give every array item a stable `id: z.string()`. It's the React key and keeps
  edits attached to the right row across add/remove/reorder.
- `.optional()` for fields that may be missing on older content, so loading
  never hard-fails.
- `z.enum([...])` for fixed choices → render as a `<select>` dropdown.
- `z.string().url()` for links/images you want validated on save.

Then make `src/data/content.json` a valid instance of the schema (seed it with
the project's current real content).

## Step 2 — generate one section component per logical group

There are exactly two patterns. Almost every real section is a mix of them.

### Pattern A — flat object of scalar fields

For a section that's a single object (a hero, site config, a CTA block). See
`assets/editor/components/HeroSection.tsx`. Core idea:

```tsx
const slice = content.hero;
const update = <K extends keyof typeof slice>(field: K, value: (typeof slice)[K]) => {
  updateContent("hero", { ...slice, [field]: value });
};
// ...one <input>/<textarea>/<select> per field, value=slice.field, onChange=update("field", ...)
```

### Pattern B — array of items with add / edit / remove

For any list (team, FAQs, sponsors, timeline, nav links). See
`assets/editor/components/FeaturesSection.tsx`. Core idea:

```tsx
const list = content.features;
const update = (i, field, value) =>
  updateContent("features", list.map((it, idx) => idx === i ? { ...it, [field]: value } : it));
const add = () =>
  updateContent("features", [...list, { id: nextId("feature", list.map(f => f.id)), /* empty fields */ }]);
const remove = (i) => updateContent("features", list.filter((_, idx) => idx !== i));
```

### Field type → control mapping

| Schema field | Control |
|--------------|---------|
| `z.string()` short | `<input class={styles.input}>` |
| `z.string()` long / prose | `<textarea class={styles.textarea}>` |
| `z.enum([...])` | `<select class={styles.select}>` with one `<option>` per value |
| `z.boolean()` | checkbox, or a two-option select |
| `z.array(z.string())` (tags) | one `<input>`; split/join on `, ` (see PeopleSection expertise tags in the source project) |
| `z.array(object)` | Pattern B nested inside the parent |
| image path field | text input **plus** the upload control (below) |

### Image upload control

Any image field gets a file input wired to the `uploadImage` prop. It POSTs to
`/api/editor/upload`, which commits the file to GitHub and returns its public
path; the callback writes that path into the field:

```tsx
<input type="file" accept="image/*" onChange={async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  await uploadImage(file, (newPath) => update("image", newPath));
}} />
```

Show a preview with `next/image` + `unoptimized` (the path may be a fresh upload
not yet known to the image optimizer).

## Step 3 — register the section in the page

In `src/app/editor/page.tsx`, three edits per section:
1. `import` the component.
2. Add `{ id, label }` to `SECTION_LINKS` (the `id` must equal the `<section id>`).
3. Render `<YourSection {...sectionProps} />` in the content area.

For very large content models, group sections into "chapters" with headings —
see the original `page.tsx` for the pattern (Core / Homepage / Mentorship / …).

## Step 4 — the Advanced JSON fallback is always there

`AdvancedJsonSection` lets the user edit the whole object as raw JSON. It's the
safety net for any field a section doesn't cover yet — but the goal is for the
structured sections to cover everything, so the user never has to touch JSON.

## How thorough to be

Match the reference bar: **every editable field in the schema should have a
dedicated control.** Don't stop at the top-level fields — recurse into nested
arrays and objects (e.g. a person's list of "mentorship tracks", a prize's list
of "rewards"). The original project has 13 section components covering a deeply
nested model; that's the standard.
