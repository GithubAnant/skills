# Architecture — how the GitHub CMS works

The whole system is "Git is the database." There is no DB and no CMS service.
All editable content lives in one JSON file in the repo (`src/data/content.json`).
The editor commits to that file via the GitHub REST API; a deploy is then
triggered so the change goes live.

## The pieces

```
/editor (client page)
   │  password login → HMAC cookie
   ▼
POST /api/editor/content  ── Zod validate ──▶ writeEditorContent()
   │                                                │
   │                                       GitHub Contents API (PUT)
   │                                       commit "chore(cms): update site content"
   ▼                                                ▼
revalidatePath("/")                        content.json updated on main branch
(running deploy shows                              │
 new content right away)                  push triggers GitHub Action
                                                   ▼
                            owner-deploy-trigger workflow → Vercel deploy
                                                   ▼
                                       fresh build bakes content into bundle
```

## Files and their jobs

| File | Job |
|------|-----|
| `src/app/editor/page.tsx` | The editor UI. Auth gate, load/save, image upload, renders section components. Deliberately unlisted from nav. |
| `src/app/editor/components/*` | One component per content section. Pure UI over `content` + `updateContent`. |
| `src/app/editor/page.module.css` | Self-contained styling (defines its own tokens). |
| `src/lib/auth.ts` | Password check + stateless HMAC session cookie. |
| `src/app/api/auth/{verify,session,logout}/route.ts` | Login, session check, logout. |
| `src/app/api/editor/content/route.ts` | GET current content / POST validated content. Auth-gated. |
| `src/app/api/editor/upload/route.ts` | POST image → stored, returns public path. Auth-gated. |
| `src/lib/editor-store.ts` | The GitHub layer. Reads/writes content.json + images via Contents API; local-FS fallback when env vars absent. |
| `src/lib/content-store.ts` | Reads the bundled content.json for public pages (cached). |
| `src/data/schemas.ts` | Zod schema = the single source of truth for the content shape. |
| `src/data/content.ts` | Build-time parse + `getSiteContent()` for public pages. |
| `src/data/content.json` | The actual content. This is what gets committed on every save. |
| `.github/workflows/*` deploy trigger | Installed by the `setup-owner-deploy-trigger` skill (see `deploy-workaround.md`). |

## Auth model (why it's stateless)

The session cookie value is `HMAC-SHA256("editor_session_v1", key=ADMIN_PASSWORD)`.
Validation only needs `ADMIN_PASSWORD` — no session store, no DB — so it works on
serverless where each request may hit a different instance. Rotating
`ADMIN_PASSWORD` invalidates all sessions (the HMAC key changed). Both the
password compare and the session compare use `timingSafeEqual`.

## Read path vs write path (important subtlety)

- **Write** goes to GitHub immediately (commit on `main`).
- **Read on public pages** comes from the `content.json` *bundled in the current
  deployment* — i.e. the build-time snapshot, via `content-store.ts`.

So a save does NOT instantly change the live site's bundled content. Two things
bridge the gap:
1. `revalidatePath("/")` after save busts the running deployment's cache.
2. The deploy-trigger workflow rebuilds, baking the new content into a fresh
   bundle.

This is by design: public reads are a fast local file read, not a GitHub API
call on every request.

## Environment variables

Set in the hosting platform (Vercel project settings):

| Var | Purpose |
|-----|---------|
| `ADMIN_PASSWORD` | The editor login password + HMAC key. |
| `GITHUB_TOKEN` | PAT with `contents:write` on the repo. Identity that authors the `chore(cms)` commits. |
| `GITHUB_OWNER` | Repo owner (user or org). |
| `GITHUB_REPO` | Repo name. |
| `GITHUB_BRANCH` | Branch to commit to. Defaults to `main`. |

If `GITHUB_TOKEN`/`OWNER`/`REPO` are absent, every store function falls back to
writing the local filesystem — which is exactly what you want in `next dev`.
