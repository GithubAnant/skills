# Design Skills

A Claude Code plugin for building visually coherent UIs, extracting design systems, and generating component previews.

## Skills

| Skill | What it does |
|-------|-------------|
| [60-30-10 Color Rule](#-60-30-10-color-rule) | Color palette framework adapted from cinematic color theory |
| [Capy](#-capy--design-system-inspector--preview-builder) | Scans your codebase to extract tokens, discover components, and build a `/preview` route |

---

### 60-30-10 Color Rule

> A framework for building visually coherent UIs — adapted from how cinematographers and production designers control color in film.

**Example triggers:**
`"pick a color palette"` · `"my UI looks off"` · `"how do I make my CTA pop"` · `"help with dark mode colors"` · `"structure my CSS color tokens"`

---

### Capy — Design System Inspector & Preview Builder

> Scans React/Next.js repos to extract CSS variables, discover components, detect the framework, and build a polished `/preview` route — all from the actual codebase, never hallucinated.

**Subcommands:**

| Command | Action |
|---------|--------|
| `/capy` | Full scan + build the `/preview` page |
| `/capy design-system` | Scan + write `.capy/design-system.json` only |
| `/capy update` | Incremental refresh — detect changes, update preview |

**Example triggers:**
`"build a component catalog"` · `"extract design tokens"` · `"audit my design system"` · `"create a /preview page"`

---

## Installation

Add the marketplace, then install:

```bash
/plugin marketplace add GithubAnant/skills
/plugin install design-skills@anant-design
```

Or test locally:

```bash
claude --plugin-dir /path/to/this/repo
```

## License

MIT
