# Design Skills

A Claude Code plugin with design skills for building visually coherent UIs.

## Skills

### 60-30-10 Color Rule

A framework for building visually coherent UIs, design systems, and interfaces — adapted from how professional cinematographers and production designers control color in film.

**Triggers when you ask about:**
- Choosing a color palette for an app or website
- Why your UI looks "off" or too colorful
- How to pick accent colors
- Designing a dark or light mode theme
- Structuring CSS color variables/tokens
- Visual hierarchy problems

### Capy — Design System Extractor

Scans React/Next.js repos to extract design tokens, discover components, and build a polished `/preview` route — all from the actual codebase.

**Triggers when you ask about:**
- Building a UI preview or component catalog
- Extracting design tokens from a codebase
- Auditing styles or design systems
- Creating a `/preview` page

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
