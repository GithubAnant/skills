#!/usr/bin/env python3
"""Install an owner empty-commit deploy trigger workflow."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


DEFAULT_WORKFLOW_FILE = "trigger-owner-deploy.yml"
DEFAULT_WORKFLOW_NAME = "Owner empty-commit + Vercel deploy"
DEFAULT_COMMIT_MESSAGE = "chore: trigger deploy"


def run_git(repo: Path, *args: str) -> str | None:
    try:
        result = subprocess.run(
            ["git", "-C", str(repo), *args],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return None
    return result.stdout.strip()


def repo_root(path: Path) -> Path:
    resolved = path.expanduser().resolve()
    root = run_git(resolved, "rev-parse", "--show-toplevel")
    return Path(root).resolve() if root else resolved


def infer_owner(repo: Path) -> str | None:
    remote = run_git(repo, "remote", "get-url", "origin")
    if not remote:
        return None

    patterns = [
        r"github\.com[:/](?P<owner>[^/\s]+)/[^/\s]+(?:\.git)?$",
        r"^https://[^@]+@github\.com/(?P<owner>[^/\s]+)/[^/\s]+(?:\.git)?$",
    ]
    for pattern in patterns:
        match = re.search(pattern, remote)
        if match:
            return match.group("owner")
    return None


def validate_owner(owner: str) -> None:
    if not re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?", owner):
        raise SystemExit(f"Invalid GitHub owner login: {owner!r}")


def validate_secret_name(name: str) -> None:
    if not re.fullmatch(r"[A-Z_][A-Z0-9_]*", name):
        raise SystemExit(f"Invalid GitHub secret name: {name!r}")


def sq(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def workflow_yaml(
    *,
    owner: str,
    branch: str,
    workflow_name: str,
    token_secret: str,
    vercel_secret: str,
    commit_message: str,
    include_vercel_hook: bool,
) -> str:
    hook_step = ""
    if include_vercel_hook:
        hook_step = f"""
      - name: Trigger Vercel deploy hook
        env:
          VERCEL_DEPLOY_HOOK_URL: ${{{{ secrets.{vercel_secret} }}}}
        run: |
          test -n "$VERCEL_DEPLOY_HOOK_URL"
          curl -fsS --max-time 30 -X POST "$VERCEL_DEPLOY_HOOK_URL"
"""

    return f"""name: {sq(workflow_name)}

on:
  push:
    branches:
      - {sq(branch)}
  workflow_dispatch:

permissions:
  contents: write

jobs:
  owner-deploy:
    runs-on: ubuntu-latest
    if: github.actor != {sq(owner)}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{{{ secrets.{token_secret} }}}}
          fetch-depth: 0
          ref: ${{{{ github.ref_name }}}}

      - name: Configure git as owner
        run: |
          git config user.name {sq(owner)}
          git config user.email {sq(owner + "@users.noreply.github.com")}

      - name: Push empty commit as owner
        run: |
          git pull --ff-only origin "$GITHUB_REF_NAME"
          git commit --allow-empty -m {sq(commit_message)}
          git push origin "HEAD:$GITHUB_REF_NAME"
{hook_step}"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Install a GitHub Actions workflow that creates an owner empty deploy commit."
    )
    parser.add_argument("--repo", default=".", help="Repository path. Defaults to current directory.")
    parser.add_argument("--owner", help="GitHub owner login. Inferred from origin URL when omitted.")
    parser.add_argument("--branch", default="main", help="Deploy branch. Defaults to main.")
    parser.add_argument("--workflow-file", default=DEFAULT_WORKFLOW_FILE)
    parser.add_argument("--workflow-name", default=DEFAULT_WORKFLOW_NAME)
    parser.add_argument("--owner-token-secret", default="OWNER_GIT_PAT")
    parser.add_argument("--vercel-deploy-hook-secret", default="VERCEL_DEPLOY_HOOK_URL")
    parser.add_argument("--commit-message", default=DEFAULT_COMMIT_MESSAGE)
    parser.add_argument("--skip-vercel-hook", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true", help="Overwrite an existing workflow file.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = repo_root(Path(args.repo))
    owner = args.owner or infer_owner(root)
    if not owner:
        raise SystemExit("Could not infer owner from origin URL. Pass --owner OWNER_LOGIN.")

    validate_owner(owner)
    validate_secret_name(args.owner_token_secret)
    validate_secret_name(args.vercel_deploy_hook_secret)
    if not args.branch.strip():
        raise SystemExit("Branch cannot be empty.")

    workflow_dir = root / ".github" / "workflows"
    workflow_path = workflow_dir / args.workflow_file
    content = workflow_yaml(
        owner=owner,
        branch=args.branch,
        workflow_name=args.workflow_name,
        token_secret=args.owner_token_secret,
        vercel_secret=args.vercel_deploy_hook_secret,
        commit_message=args.commit_message,
        include_vercel_hook=not args.skip_vercel_hook,
    )

    if args.dry_run:
        print(f"# Would write: {workflow_path}")
        print(content)
        return 0

    if workflow_path.exists() and not args.force:
        current = workflow_path.read_text()
        if current != content:
            raise SystemExit(f"{workflow_path} exists. Re-run with --force after reviewing it.")
        print(f"Already up to date: {workflow_path}")
        return 0

    workflow_dir.mkdir(parents=True, exist_ok=True)
    workflow_path.write_text(content)
    print(f"Wrote {workflow_path}")
    print(f"Owner: {owner}")
    print(f"Branch: {args.branch}")
    print(f"Owner token secret: {args.owner_token_secret}")
    if args.skip_vercel_hook:
        print("Vercel hook: omitted")
    else:
        print(f"Vercel hook secret: {args.vercel_deploy_hook_secret}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
