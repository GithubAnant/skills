# The cross-account Vercel deploy trigger

The editor commits content to GitHub, but a commit alone may not deploy. This
doc explains **why**, then hands the actual setup off to the dedicated
`setup-owner-deploy-trigger` skill in this same plugin — which owns this pattern
end to end (installer script, PAT instructions, verification, failure modes).

## Why a deploy trigger is needed

- The Vercel project is on the **free/Hobby plan**.
- The Vercel project is connected to **GitHub account B** — the "owner" account.
- The CMS commits content as **account A** — the identity whose PAT is in
  `GITHUB_TOKEN`.

On the free plan, Vercel's Git integration **only auto-deploys for pushes it
attributes to the connected account**. So when account A pushes the
`chore(cms): update site content` commit, it lands on `main` but Vercel does
**not** build. Content is committed; the live site never updates. The push is
effectively blocked from deploying.

## The fix (handled by setup-owner-deploy-trigger)

A GitHub Action watches pushes to the deploy branch. When the pusher is **not**
the owner, it re-commits an empty commit **authored by the owner** (via
`OWNER_GIT_PAT`) and optionally pings the Vercel deploy hook. That owner-attributed
push is what Vercel will build.

The job guard `if: github.actor != '<owner-login>'` is the loop-breaker: the
owner's own empty commit re-fires the workflow, but that run is skipped because
the actor is now the owner. The loop terminates after exactly one extra commit.

## How to set it up

**Use the `setup-owner-deploy-trigger` skill** — don't hand-roll the workflow
here. It provides:

- `scripts/install_owner_deploy_trigger.py` to generate
  `.github/workflows/trigger-owner-deploy.yml` with the correct guard, branch,
  and owner login.
- Exact fine-grained PAT creation steps for `OWNER_GIT_PAT`.
- The `VERCEL_DEPLOY_HOOK_URL` secret setup.
- `gh` verification commands and a failure-mode catalog.

Typical invocation from the target repo:

```bash
python /path/to/setup-owner-deploy-trigger/scripts/install_owner_deploy_trigger.py \
  --repo . --owner <OWNER_LOGIN> --branch main
```

Then add the `OWNER_GIT_PAT` and `VERCEL_DEPLOY_HOOK_URL` repo secrets as that
skill describes, commit the workflow, and verify the Actions runs.

## How this connects to the CMS

- The CMS commits as account A → `chore(cms): update site content`.
- That push fires the owner-deploy-trigger workflow (actor ≠ owner) → owner
  empty commit + deploy → Vercel builds → the new `content.json` is baked into a
  fresh bundle and goes fully live.

## When you DON'T need it

If the Vercel project is connected to the **same** GitHub account whose PAT the
CMS commits with, Vercel auto-deploys on the `chore(cms)` push directly. Skip
the trigger entirely in that case.
