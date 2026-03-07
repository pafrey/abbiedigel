# Dev Testing Plan

## Goal

Make it possible to run `bundle exec jekyll serve` locally with realistic mock data, so that
HTML/CSS/template changes can be tested without running the fetch script, touching the
production Sanity dataset, or needing valid API credentials.

---

## Approach

Commit a `_data-mock/` directory to the repo containing static JSON files that mirror the
structure of the files `fetch-sanity-data.js` writes to `_data/`. A single npm script copies
them into `_data/` before a local Jekyll serve. Since `_data/` is gitignored, the mock files
never interfere with the real build.

```
_data-mock/
  home.json
  about.json
  books.json
  book_meta.json
  workshops.json
```

---

## Step 1 — Create `_data-mock/`

Create the directory and one JSON file per data file the fetch script produces.

### `_data-mock/home.json`

Mirrors `site.data.home` (used by `index.html`).

```json
{
  "heroHeading": "Stories, workshops, and the books that change everything.",
  "heroDescription": "Abbie Digel helps families find the right books at the right moment—and runs workshops that turn reading into conversation.",
  "serviceCards": [
    {
      "heading": "Book Recommendations",
      "body": "Curated picks for every age and mood, with notes on why each one matters.",
      "linkLabel": "Browse the list",
      "linkHref": "/book-recommendations.html"
    },
    {
      "heading": "Workshops + Events",
      "body": "Live sessions for parents, educators, and kids. Virtual and in-person.",
      "linkLabel": "See upcoming events",
      "linkHref": "/workshops.html"
    },
    {
      "heading": "Newsletter",
      "body": "A monthly letter with new picks, reading tips, and upcoming events.",
      "linkLabel": "Subscribe",
      "linkHref": "/newsletter.html"
    }
  ]
}
```

### `_data-mock/about.json`

Mirrors `site.data.about` (used by `about.html`). The `bioHtml` field is pre-rendered HTML,
matching what `@portabletext/to-html` would produce from portable text.

```json
{
  "bioHtml": "<p>Abbie Digel is a children's literature specialist and workshop facilitator based in Colorado. She believes the right book at the right moment can open a child's world in ways nothing else can.</p><p>She works with families, schools, and libraries to match readers with stories that resonate—and leads workshops that help adults talk about books with the kids in their lives.</p>",
  "headshot": null
}
```

### `_data-mock/books.json`

Mirrors `site.data.books` (used by `book-recommendations.html`). Include enough variety
to exercise all three filter dimensions (age range, theme, moment).

```json
[
  {
    "title": "The Snowy Day",
    "author": "Ezra Jack Keats",
    "ageRange": "babies",
    "themes": ["seasons", "wonder", "play"],
    "moment": ["bedtime", "read-aloud"],
    "whyILoveIt": "Pure sensory delight. The simplicity of a child walking through snow is captured so perfectly that babies and adults both go quiet.",
    "coverImage": null
  },
  {
    "title": "Goodnight Moon",
    "author": "Margaret Wise Brown",
    "ageRange": "babies",
    "themes": ["bedtime", "comfort", "home"],
    "moment": ["bedtime"],
    "whyILoveIt": "The rhythm slows everything down. It's not just a book—it's a ritual.",
    "coverImage": null
  },
  {
    "title": "Where the Wild Things Are",
    "author": "Maurice Sendak",
    "ageRange": "toddlers",
    "themes": ["imagination", "feelings", "home"],
    "moment": ["read-aloud", "discussion"],
    "whyILoveIt": "Max's journey through big feelings and back to safety is one of the most emotionally complete stories ever told for young children.",
    "coverImage": null
  },
  {
    "title": "Corduroy",
    "author": "Don Freeman",
    "ageRange": "toddlers",
    "themes": ["friendship", "belonging", "home"],
    "moment": ["bedtime", "read-aloud"],
    "whyILoveIt": "A gentle story about wanting to belong. Kids feel Corduroy's longing viscerally, and the ending never gets old.",
    "coverImage": null
  },
  {
    "title": "Frog and Toad Are Friends",
    "author": "Arnold Lobel",
    "ageRange": "pre-school",
    "themes": ["friendship", "kindness", "humor"],
    "moment": ["read-aloud", "discussion"],
    "whyILoveIt": "These two are the best friend pair in all of children's literature. Every story is a small lesson in what it means to care for someone.",
    "coverImage": null
  },
  {
    "title": "The Very Hungry Caterpillar",
    "author": "Eric Carle",
    "ageRange": "pre-school",
    "themes": ["nature", "growth", "counting"],
    "moment": ["read-aloud"],
    "whyILoveIt": "The die-cut pages make reading feel interactive. Kids love counting the foods long before they know they're learning.",
    "coverImage": null
  },
  {
    "title": "Charlotte's Web",
    "author": "E.B. White",
    "ageRange": "K-2",
    "themes": ["friendship", "loss", "nature"],
    "moment": ["read-aloud", "discussion"],
    "whyILoveIt": "The first book that made me cry. Charlotte's sacrifice is handled with such honesty—it gives kids language for grief without softening it.",
    "coverImage": null
  },
  {
    "title": "Pippi Longstocking",
    "author": "Astrid Lindgren",
    "ageRange": "K-2",
    "themes": ["independence", "humor", "adventure"],
    "moment": ["read-aloud"],
    "whyILoveIt": "Pippi is the antidote to every book where children are told to be small. She's chaotic and joyful and completely her own person.",
    "coverImage": null
  },
  {
    "title": "A Wrinkle in Time",
    "author": "Madeleine L'Engle",
    "ageRange": "3-5",
    "themes": ["adventure", "courage", "science"],
    "moment": ["read-aloud", "discussion"],
    "whyILoveIt": "One of the few books that takes a girl's intellectual curiosity seriously and makes the universe feel both vast and personal.",
    "coverImage": null
  },
  {
    "title": "The Phantom Tollbooth",
    "author": "Norton Juster",
    "ageRange": "3-5",
    "themes": ["imagination", "curiosity", "wordplay"],
    "moment": ["read-aloud", "discussion"],
    "whyILoveIt": "Every chapter is a pun that becomes a world. This book made me fall in love with language as a child and I've never recovered.",
    "coverImage": null
  }
]
```

### `_data-mock/book_meta.json`

Mirrors `site.data.book_meta` (used to build the filter dropdowns). The `themes` and
`moments` arrays should be the sorted union of all values in `books.json` above.

```json
{
  "ageRanges": ["babies", "toddlers", "pre-school", "K-2", "3-5"],
  "themes": [
    "adventure",
    "bedtime",
    "belonging",
    "comfort",
    "courage",
    "counting",
    "curiosity",
    "feelings",
    "friendship",
    "growth",
    "home",
    "humor",
    "imagination",
    "independence",
    "kindness",
    "loss",
    "nature",
    "play",
    "science",
    "seasons",
    "wonder",
    "wordplay"
  ],
  "moments": ["bedtime", "discussion", "read-aloud"]
}
```

### `_data-mock/workshops.json`

Mirrors `site.data.workshops` (used by `workshops.html`). Include one upcoming and one past
event to exercise both branches of the template.

```json
{
  "upcoming": [
    {
      "name": "Reading Aloud with Intention",
      "date": "2026-04-12",
      "time": "10:00 AM – 11:30 AM",
      "location": "Denver Public Library – Central Branch",
      "descriptionHtml": "<p>A practical workshop on how to read aloud in ways that invite conversation—not just comprehension. We'll cover pacing, voice, and how to pause in the right places.</p>",
      "price": "$20",
      "registrationUrl": "https://example.com/register"
    }
  ],
  "past": [
    {
      "name": "Books for Big Feelings",
      "date": "2026-01-18",
      "time": "2:00 PM – 3:30 PM",
      "location": "Boulder Public Library",
      "descriptionHtml": "<p>An exploration of picture books that help children name and navigate difficult emotions, with guidance on how to talk through them afterward.</p>",
      "price": "Free",
      "registrationUrl": null
    }
  ]
}
```

---

## Step 2 — Add an npm Script

Add a `mock` script to `package.json` that copies the mock files into `_data/`:

```json
"scripts": {
  "mock": "node -e \"const fs=require('fs');fs.mkdirSync('_data',{recursive:true});fs.readdirSync('_data-mock').forEach(f=>fs.copyFileSync('_data-mock/'+f,'_data/'+f));console.log('Mock data copied to _data/');\""
}
```

Or, if the inline node command feels too cramped, extract it to a tiny script at
`scripts/use-mock-data.js`:

```js
// scripts/use-mock-data.js
import fs from 'fs'

fs.mkdirSync('_data', { recursive: true })
for (const file of fs.readdirSync('_data-mock')) {
  fs.copyFileSync(`_data-mock/${file}`, `_data/${file}`)
}
console.log('Mock data copied to _data/')
```

And in `package.json`:

```json
"mock": "node scripts/use-mock-data.js"
```

---

## Step 3 — Update `.gitignore`

`_data-mock/` must NOT be gitignored. Verify `.gitignore` only excludes `_data/`, not
`_data-mock/`. No change needed based on the current `.gitignore`.

---

## Dev Workflow

```bash
# 1. Copy mock data into _data/
npm run mock

# 2. Serve the site locally
bundle exec jekyll serve

# Visit http://localhost:4000
```

Any time you edit a mock file, re-run `npm run mock` (or just run `jekyll serve --watch`
once the files are in place — Jekyll will pick up changes to `_data/` automatically).

---

## When to Update the Mock Data

- **After adding a new field to a schema** — add the field to the relevant mock file so
  templates that reference it can be tested.
- **After adding a new page or data file** — add a corresponding `_data-mock/*.json` file.
- **When testing an edge case** — temporarily edit a mock file (e.g., empty `upcoming`
  array, a book with no cover image, a theme with special characters). Don't commit
  edge-case edits unless they're worth keeping as permanent fixtures.

---

## What This Doesn't Cover

- **Image rendering** — mock books use `"coverImage": null`, so cover image slots will be
  empty. To test image layout, temporarily point a `coverImage` value at any publicly
  accessible image URL and edit the fetch script output format accordingly.
- **Sanity Studio itself** — this approach only tests the Jekyll side. Studio UI and schema
  changes still need to be verified against the real Sanity project
  (`cd abbie-digel && npm run dev`).
- **The fetch script** — to test `fetch-sanity-data.js` end-to-end, run it against a
  Sanity `development` dataset (see below).

---

## Optional: Sanity Development Dataset

If you want to test the full pipeline (fetch script → Jekyll) without touching production
content, create a second dataset in the Sanity project:

```bash
cd abbie-digel
npx sanity dataset create development
```

Then run the fetch script pointed at it:

```bash
SANITY_PROJECT_ID=h0v4uijz SANITY_DATASET=development SANITY_TOKEN=xxx node scripts/fetch-sanity-data.js
```

Seed it with a few test books via the Studio (run `npm run dev` inside `abbie-digel/` and
switch datasets in the Studio settings). This is only necessary when testing the fetch
script itself—for HTML/CSS/template work, the mock JSON files are faster and simpler.
