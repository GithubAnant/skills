---
name: nextjs-github-cms
description: >-
  Add a self-hosted, no-database CMS to a Next.js (App Router) site, where a
  password-protected /editor page lets a non-technical user edit site content
  and images, and every save commits to GitHub and auto-triggers a Vercel
  deploy. Use this whenever the user wants an admin/editor page, a content
  editor, an in-app CMS, editable site copy, a "let my client edit the site"
  setup, or content stored in GitHub instead of a database — even if they don't
  say the word "CMS". Pairs with the setup-owner-deploy-trigger skill for the
  Vercel free-plan cross-account deploy fix (CMS commits as one GitHub account,
  Vercel project connected to a different/owner account). Replicates the editor
  + GitHub storage pattern into any Next.js project.
---

# Next.js + GitHub CMS

Install a complete "Git is the database" CMS into a Next.js App Router project:
a password-protected `/editor` page that edits structured content and images,
commits each save to GitHub via the REST API, and auto-deploys to Vercel — even
across the free-plan cross-account-push limitation.

There is **no database and no third-party CMS**. Content is one JSON file in the
repo (`src/data/content.json`); the editor commits to it.

## When to use

Trigger on requests like: "add an editor page so my client can edit the site",
"build a CMS without a database", "let me edit content and have it deploy
automatically", "store content in GitHub", "admin page to update copy/images",
or anything about the Vercel-free-plan deploy trigger workaround. The user need
not say "CMS".

## What gets installed

Two halves. The **engine** is copied near-verbatim (it's generic). The
**editor UI** is tailored to the specific project's content shape.

```
src/
  app/
    editor/
      page.tsx                 ← editor UI (tailor sections to the project)
      page.module.css          ← self-contained styling
      components/              ← one section component per content group
    api/
      auth/{verify,session,logout}/route.ts   ← engine (verbatim)
      editor/{content,upload}/route.ts        ← engine (verbatim)
  lib/
    auth.ts                    ← engine: HMAC session + password (verbatim)
    editor-store.ts            ← engine: GitHub Contents API storage (verbatim)
    content-store.ts           ← engine: cached local read for public pages (verbatim)
  data/
    schemas.ts                 ← TAILOR: Zod model = source of truth for fields
    content.ts                 ← engine glue (verbatim)
    content.json               ← the content itself (seed with real content)
```

Plus a GitHub Actions deploy trigger — **set up via the sibling
`setup-owner-deploy-trigger` skill**, not bundled here (see step 5).

Bundled templates live in this skill's `assets/`. Copy them, then tailor the
two marked files plus the section components.

## Prerequisites — verify first

1. **Next.js App Router** (`src/app/` exists). If it's Pages Router or no `src/`,
   adapt paths; the API route shape differs in Pages Router.
2. **`@/*` path alias → `src/*`** in `tsconfig.json`. The engine imports `@/lib/...`
   and `@/data/...`. If the alias differs, adjust imports or add the alias.
3. **`zod` installed** (`npm i zod`). Used for the schema.
4. Confirm the host is **Vercel**. The deploy workflow is Vercel-specific; the
   editor + GitHub storage work on any host.

## Install workflow

Work in this order. Don't skip the schema step — everything keys off it.

### 1. Copy the engine (verbatim)

Copy these from `assets/` to the project unchanged:
- `assets/lib/{auth,editor-store,content-store}.ts` → `src/lib/`
- `assets/api/auth/*` → `src/app/api/auth/*`
- `assets/api/editor/*` → `src/app/api/editor/*`
- `assets/data/content.ts` → `src/data/content.ts`

### 2. Model the content (TAILOR — the important step)

Define `src/data/schemas.ts` as a Zod `SiteContentSchema` matching the project's
real content. Start from `assets/data/schemas.starter.ts`. Read
**`references/building-sections.md`** for how to inventory existing content,
choose field types, and structure the schema. Then create
`src/data/content.json` as a valid instance (seed it with the site's current
real content, not lorem ipsum).

### 3. Build the editor UI (TAILOR)

- Copy `assets/editor/page.tsx`, `page.module.css`, and
  `components/{types,HeroSection,FeaturesSection,AdvancedJsonSection}.tsx`.
- The two example sections demonstrate the only two patterns you need
  (flat-object fields, and array CRUD with image upload). Following
  `references/building-sections.md`, replace/extend them so **every field in the
  schema has a dedicated control**. Register each in `page.tsx`
  (`SECTION_LINKS` + import + render). Keep `AdvancedJsonSection` as the
  catch-all.
- The CSS is self-contained (defines its own dark-theme tokens scoped to
  `.page`). If the project has its own design tokens, you can delete the token
  block to inherit them.

### 4. Wire public pages to the content (if needed)

Public pages should read content via `getSiteContent()` from `src/data/content.ts`
(or `readContent()` from `content-store.ts`) instead of hardcoded values, so
edits actually show up. This step is about refactoring existing components to
consume the content object.

### 5. Set up the deploy trigger (use the sibling skill)

The CMS commits content to GitHub, but on the Vercel free plan a commit from a
non-owner account won't auto-deploy. **Hand this off to the
`setup-owner-deploy-trigger` skill** in this same plugin — it owns the workflow
end to end (installer script, PAT setup, verification, failure modes). Don't
hand-roll a workflow here.

Read **`references/deploy-workaround.md`** for why it's needed and how it
connects to the CMS, then invoke that skill from the target repo, e.g.:

```bash
python /path/to/setup-owner-deploy-trigger/scripts/install_owner_deploy_trigger.py \
  --repo . --owner <OWNER_LOGIN> --branch main
```

If the Vercel project is connected to the **same** account the CMS commits with,
no trigger is needed — Vercel auto-deploys on the commit. Tell the user.

### 6. Configure secrets and env vars

**Vercel project env** (Settings → Environment Variables):
| Var | Value |
|-----|-------|
| `ADMIN_PASSWORD` | Editor login password (also the HMAC session key). |
| `GITHUB_TOKEN` | PAT (the CMS's committing identity) with `contents:write` on the repo. |
| `GITHUB_OWNER` | Repo owner. |
| `GITHUB_REPO` | Repo name. |
| `GITHUB_BRANCH` | Usually `main`. |

**GitHub repo secrets** for the deploy trigger (`OWNER_GIT_PAT`,
`VERCEL_DEPLOY_HOOK_URL`) are set up by the `setup-owner-deploy-trigger` skill —
see step 5.

These are secrets — never write them into committed files. The user sets them in
the dashboards; suggest the values, don't fabricate tokens.

### 7. Verify

- `npm run dev` → visit `/editor`. With no GitHub env vars set locally, saves
  write the local `content.json` (the built-in dev fallback) — good for testing
  the UI.
- Confirm: login works, each section loads current content, edits + Save
  succeed, image upload returns a path and previews.
- In production, a Save should produce a `chore(cms): update site content`
  commit and (via the workflow) a deploy.

## How it works (quick mental model)

- **Save** → `POST /api/editor/content` → Zod validate → `editor-store` PUTs
  `content.json` to GitHub (commit `chore(cms): update site content`) →
  `revalidatePath("/")`.
- **Public read** → `content-store` reads the `content.json` *bundled in the
  current deploy* (fast, cached). New content goes fully live after the rebuild.
- **Deploy** → the `chore(cms)` push fires the owner-deploy-trigger workflow
  (installed by `setup-owner-deploy-trigger`), which makes an empty
  `chore: trigger deploy` commit as the owner and pings the Vercel hook.

Full detail in `references/architecture.md`.

## Reference files

- `references/architecture.md` — full data flow, file-by-file roles, auth model,
  read-vs-write subtlety, env vars.
- `references/deploy-workaround.md` — why the cross-account Vercel deploy trigger
  is needed and how it connects to the CMS. Setup itself is the
  `setup-owner-deploy-trigger` skill. **Read before step 5.**
- `references/building-sections.md` — how to model the schema and build tailored
  section components (the per-project work). **Read before building the UI.**
