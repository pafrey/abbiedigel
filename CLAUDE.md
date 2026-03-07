# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Format all HTML and CSS files
npm run format

# Check formatting without writing
npm run format:check
```

## Architecture

This is a static personal website for Abbie Digel, deployed to GitHub Pages via Jekyll (see `.github/workflows/jekyll-gh-pages.yml`). Pushes to `master` trigger automatic deployment.

**Pages:** `index.html`, `about.html`, `book-recommendations.html`, `workshops.html`, `newsletter.html`

**Shared stylesheet:** `styles.css` — a single flat CSS file used by all pages. There is no build step for CSS.

**Nav pattern:** Every HTML page duplicates the same `<header>` nav block. When adding or renaming pages, update the nav in all HTML files.

**Color palette:**
- Background: `#f4f1ec` (warm off-white)
- Accent/card bg: `#ebdad2` (warm beige)
- Border: `#cecdcd`
- Text/primary: `#717254` (olive)
- Hover dark: `#5a5a40`

**Newsletter:** Embedded via Buttondown's embeddable form. Styles for `.embeddable-buttondown-form` are in `styles.css`.

**No JavaScript, no framework, no build tooling** beyond Prettier for formatting.

## Sanity Studio

A Sanity Studio lives in `abbie-digel/` (separate Node project).

- **Project ID:** `h0v4uijz`
- **Dataset:** `production`
- **Schema types:** `homePage`, `aboutPage`, `book`, `workshop` (defined in `abbie-digel/schemaTypes/`)

```bash
cd abbie-digel
npm run dev      # start local Studio
```

**Schema deployment:** The Sanity CLI (`npx sanity schema deploy`) hangs due to an auth issue. Deploy schemas via the Claude Code MCP connection instead — just ask.

Schema types go in `abbie-digel/schemaTypes/` and must be registered in `schemaTypes/index.ts`.
