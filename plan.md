# Sanity CMS Integration Plan

## Goal

Allow Abbie to update site content (books, workshops, about text, homepage copy) through
a friendly web editor—without touching code or GitHub—while keeping the site fast, static,
and free to host on GitHub Pages.

---

## Architecture Overview

The approach keeps GitHub Pages as the host and adds a Sanity project as the content backend.
A small Node script runs inside the existing GitHub Actions build to fetch content from Sanity
before Jekyll builds the HTML. When Abbie publishes a change in Sanity, a webhook triggers a
new GitHub Actions run, and the site updates within about 90 seconds.

```
Abbie edits in Sanity Studio (abbieDigel.sanity.studio)
        │
        │  hits "Publish"
        ▼
Sanity fires a webhook
        │
        ▼
GitHub Actions triggered
  1. node fetch-sanity-data.js  →  writes _data/*.json
  2. jekyll build               →  reads _data/*.json, renders HTML
  3. deploy to GitHub Pages     →  site is live
```

No JavaScript runs in the visitor's browser. The site stays purely static.

---

## What Content Moves to Sanity

| Page                  | Editable fields                                                                 |
| --------------------- | ------------------------------------------------------------------------------- |
| Homepage              | Hero heading, hero description, each service card (heading + body + link label) |
| About                 | Bio text (rich text), headshot photo                                            |
| Book Recommendations  | Books (title, author, age range, themes, description, cover image, library note), organized into named lists |
| Workshops & Events    | Each event (name, date, time, location, description, registration URL, price)   |

The Newsletter page is not included—its only content is the Buttondown embed, which doesn't
need a CMS. The nav links are also not in Sanity; they live in a shared Jekyll include.

---

## Step 1 — Create the Sanity Project

```bash
npm create sanity@latest
# ? Project name: abbie-digel
# ? Use the default dataset configuration? Yes
# ? Project output path: studio/
# ? Select project template: Clean project with no predefined schemas
```

This creates a `studio/` directory inside the repo. Sanity Studio will be deployed separately
to Sanity's free managed hosting (sanity.io/manage).

---

## Step 2 — Define Schemas

Create these files inside `studio/schemaTypes/`:

### `studio/schemaTypes/homePage.js`

A singleton document (only one exists). Defines the homepage hero and the three service cards.

```js
export default {
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    {
      name: 'heroHeading',
      title: 'Hero Heading',
      type: 'string',
    },
    {
      name: 'heroDescription',
      title: 'Hero Description',
      type: 'text',
      rows: 3,
    },
    {
      name: 'serviceCards',
      title: 'Service Cards',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'heading', title: 'Heading', type: 'string' },
            { name: 'body', title: 'Body', type: 'text', rows: 4 },
            { name: 'linkLabel', title: 'Link Label', type: 'string' },
            { name: 'linkHref', title: 'Link URL', type: 'string' },
          ],
        },
      ],
    },
  ],
}
```

### `studio/schemaTypes/aboutPage.js`

```js
export default {
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  fields: [
    {
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [{ type: 'block' }], // Sanity portable text — renders rich text
    },
    {
      name: 'headshot',
      title: 'Headshot',
      type: 'image',
      options: { hotspot: true },
    },
  ],
}
```

### `studio/schemaTypes/book.js`

```js
export default {
  name: 'book',
  title: 'Book',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'author', title: 'Author', type: 'string' },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'ageRange',
      title: 'Age Range',
      type: 'string',
      options: {
        list: ['0–2', '2–4', '4–6', '6–8', '8–12'],
      },
    },
    {
      name: 'themes',
      title: 'Themes',
      description: 'e.g. nature, friendship, loss, curiosity',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    },
    {
      name: 'description',
      title: 'Description / Why I Love It',
      type: 'text',
      rows: 4,
    },
    {
      name: 'libraryNote',
      title: 'Library Note',
      description: 'e.g. "Available at most Jefferson County branches"',
      type: 'string',
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'author', media: 'coverImage' },
  },
}
```

### `studio/schemaTypes/bookList.js`

Groups books into named lists (e.g., "For 2–4 Year Olds", "Summer Reads").

```js
export default {
  name: 'bookList',
  title: 'Book List',
  type: 'document',
  fields: [
    { name: 'title', title: 'List Title', type: 'string' },
    {
      name: 'description',
      title: 'List Description',
      type: 'text',
      rows: 2,
    },
    {
      name: 'books',
      title: 'Books',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'book' }] }],
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
    },
  ],
  preview: {
    select: { title: 'title' },
  },
}
```

### `studio/schemaTypes/workshop.js`

```js
export default {
  name: 'workshop',
  title: 'Workshop / Event',
  type: 'document',
  fields: [
    { name: 'name', title: 'Event Name', type: 'string' },
    { name: 'date', title: 'Date', type: 'date' },
    { name: 'time', title: 'Time', type: 'string', description: 'e.g. 10:00 AM – 12:00 PM' },
    { name: 'location', title: 'Location', type: 'string' },
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    },
    { name: 'price', title: 'Price', type: 'string', description: 'e.g. $25 or Free' },
    { name: 'registrationUrl', title: 'Registration URL', type: 'url' },
  ],
  orderings: [
    {
      title: 'Date, Upcoming First',
      name: 'dateAsc',
      by: [{ field: 'date', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'date' },
  },
}
```

### `studio/schemaTypes/index.js`

```js
import homePage from './homePage'
import aboutPage from './aboutPage'
import book from './book'
import bookList from './bookList'
import workshop from './workshop'

export const schemaTypes = [homePage, aboutPage, book, bookList, workshop]
```

---

## Step 3 — Data Fetch Script

Create `scripts/fetch-sanity-data.js` at the repo root. This runs during the GitHub Actions
build and writes JSON files that Jekyll reads.

```js
// scripts/fetch-sanity-data.js
// Run with: node scripts/fetch-sanity-data.js
// Requires env vars: SANITY_PROJECT_ID, SANITY_DATASET, SANITY_TOKEN

import { createClient } from '@sanity/client'
import { toHTML } from '@portabletext/to-html'
import fs from 'fs'
import path from 'path'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false, // always fresh at build time
})

// Returns the Sanity image CDN URL for an image asset reference
function imageUrl(ref) {
  if (!ref) return null
  // ref format: image-abc123-800x600-jpg
  const [, id, dimensions, ext] = ref.split('-')
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET || 'production'
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${ext}`
}

async function fetchAll() {
  const [homePage, aboutPage, bookLists, workshops] = await Promise.all([
    client.fetch(`*[_type == "homePage"][0]`),
    client.fetch(`*[_type == "aboutPage"][0]`),
    client.fetch(`
      *[_type == "bookList"] | order(order asc) {
        title,
        description,
        "books": books[]->{
          title,
          author,
          ageRange,
          themes,
          description,
          libraryNote,
          "coverImage": coverImage.asset._ref
        }
      }
    `),
    client.fetch(`
      *[_type == "workshop"] | order(date asc) {
        name,
        date,
        time,
        location,
        description,
        price,
        registrationUrl
      }
    `),
  ])

  // Resolve portable text to HTML for fields that use it
  const aboutHtml = aboutPage?.bio
    ? toHTML(aboutPage.bio)
    : '<p>Coming soon.</p>'

  const workshopsWithHtml = workshops.map((w) => ({
    ...w,
    descriptionHtml: w.description ? toHTML(w.description) : '',
  }))

  // Resolve cover image URLs
  const bookListsWithUrls = bookLists.map((list) => ({
    ...list,
    books: list.books.map((b) => ({
      ...b,
      coverImage: imageUrl(b.coverImage),
    })),
  }))

  // Split workshops into upcoming and past
  const today = new Date().toISOString().slice(0, 10)
  const upcomingWorkshops = workshopsWithHtml.filter((w) => w.date >= today)
  const pastWorkshops = workshopsWithHtml.filter((w) => w.date < today)

  // Write _data/ files for Jekyll
  const dataDir = path.resolve('_data')
  fs.mkdirSync(dataDir, { recursive: true })

  fs.writeFileSync(
    path.join(dataDir, 'home.json'),
    JSON.stringify(homePage ?? {}, null, 2),
  )
  fs.writeFileSync(
    path.join(dataDir, 'about.json'),
    JSON.stringify({ bioHtml: aboutHtml, headshot: imageUrl(aboutPage?.headshot?.asset?._ref) }, null, 2),
  )
  fs.writeFileSync(
    path.join(dataDir, 'book_lists.json'),
    JSON.stringify(bookListsWithUrls, null, 2),
  )
  fs.writeFileSync(
    path.join(dataDir, 'workshops.json'),
    JSON.stringify({ upcoming: upcomingWorkshops, past: pastWorkshops }, null, 2),
  )

  console.log('Sanity data written to _data/')
}

fetchAll().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

Add the required packages:

```bash
npm install @sanity/client @portabletext/to-html
```

The `SANITY_TOKEN` needs read access to the dataset. Generate one in the Sanity dashboard under
API > Tokens (use "Viewer" role). Add it as a GitHub Actions secret.

---

## Step 4 — Convert HTML Pages to Jekyll Templates

Jekyll requires a specific directory layout. Rename/convert the files:

```
_layouts/
  base.html          ← shared HTML shell (head, header, footer)
_includes/
  nav.html           ← the duplicated <header> block, written once
index.html           ← now uses layout: base and Liquid tags
about.html
book-recommendations.html
workshops.html
newsletter.html
_data/               ← written by fetch-sanity-data.js at build time
  home.json
  about.json
  book_lists.json
  workshops.json
```

### `_layouts/base.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ page.title }} - Abbie Digel</title>
    <link rel="stylesheet" href="/styles.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    {% include nav.html %}
    <main>
      {{ content }}
    </main>
    <footer>
      <div class="container">
        <p>&copy; {{ site.time | date: "%Y" }} Abbie Digel. All rights reserved.</p>
      </div>
    </footer>
  </body>
</html>
```

### `_includes/nav.html`

```html
<header>
  <nav>
    <div class="nav-container">
      <div class="logo"><a href="/">Abbie Digel</a></div>
      <ul class="nav-links">
        <li><a href="/about.html">About</a></li>
        <li><a href="/book-recommendations.html">Book Recommendations</a></li>
        <li><a href="/workshops.html">Workshops + Events</a></li>
        <li><a href="/newsletter.html">Newsletter</a></li>
      </ul>
    </div>
  </nav>
</header>
```

### `index.html` (converted)

```html
---
layout: base
title: Home
---

<section class="hero">
  <div class="container">
    <div class="hero-content">
      <div class="hero-text">
        <h1>{{ site.data.home.heroHeading }}</h1>
        <p class="hero-description">{{ site.data.home.heroDescription }}</p>
      </div>
      <div class="hero-image">
        <img src="media/abbie-hero.jpg" alt="Abbie Digel" class="hero-img" />
      </div>
    </div>

    <div class="services-grid">
      {% for card in site.data.home.serviceCards %}
      <div class="service-card" style="margin-bottom: 3rem">
        <h3>{{ card.heading }}</h3>
        <p>{{ card.body }}</p>
        {% if card.linkHref %}
        <a href="{{ card.linkHref }}" class="service-link" style="display:block;margin-top:1rem">
          → {{ card.linkLabel }}
        </a>
        {% endif %}
      </div>
      {% endfor %}
    </div>
  </div>
</section>
```

### `about.html` (converted)

```html
---
layout: base
title: About
---

<section class="page-header">
  <div class="container">
    <h1>About</h1>
    {% if site.data.about.headshot %}
    <img src="{{ site.data.about.headshot }}" alt="Abbie Digel" class="headshot" />
    {% endif %}
    <div class="bio">
      {{ site.data.about.bioHtml }}
    </div>
  </div>
</section>
```

### `book-recommendations.html` (converted)

```html
---
layout: base
title: Book Recommendations
---

<section class="page-header">
  <div class="container">
    <h1>Book Recommendations</h1>

    {% for list in site.data.book_lists %}
    <div class="book-list">
      <h2>{{ list.title }}</h2>
      {% if list.description %}<p>{{ list.description }}</p>{% endif %}

      <div class="book-grid">
        {% for book in list.books %}
        <div class="book-card">
          {% if book.coverImage %}
          <img src="{{ book.coverImage }}" alt="Cover of {{ book.title }}" class="book-cover" />
          {% endif %}
          <div class="book-info">
            <h3>{{ book.title }}</h3>
            <p class="book-author">{{ book.author }}</p>
            {% if book.ageRange %}<p class="book-age">Ages {{ book.ageRange }}</p>{% endif %}
            {% if book.themes %}
            <p class="book-themes">
              {% for theme in book.themes %}<span class="tag">{{ theme }}</span>{% endfor %}
            </p>
            {% endif %}
            <p>{{ book.description }}</p>
            {% if book.libraryNote %}<p class="library-note">{{ book.libraryNote }}</p>{% endif %}
          </div>
        </div>
        {% endfor %}
      </div>
    </div>
    {% endfor %}

  </div>
</section>
```

### `workshops.html` (converted)

```html
---
layout: base
title: Workshops + Events
---

<section class="page-header">
  <div class="container">
    <h1>Workshops + Events</h1>

    {% if site.data.workshops.upcoming.size > 0 %}
    <h2>Upcoming</h2>
    {% for event in site.data.workshops.upcoming %}
    <div class="event-card">
      <h3>{{ event.name }}</h3>
      <p class="event-meta">
        {{ event.date | date: "%B %-d, %Y" }}
        {% if event.time %} &middot; {{ event.time }}{% endif %}
        {% if event.location %} &middot; {{ event.location }}{% endif %}
      </p>
      <div class="event-description">{{ event.descriptionHtml }}</div>
      {% if event.price %}<p class="event-price">{{ event.price }}</p>{% endif %}
      {% if event.registrationUrl %}
      <a href="{{ event.registrationUrl }}" class="service-link" target="_blank">Register →</a>
      {% endif %}
    </div>
    {% endfor %}
    {% else %}
    <p>No upcoming events right now. Check back soon.</p>
    {% endif %}

    {% if site.data.workshops.past.size > 0 %}
    <h2>Past Events</h2>
    {% for event in site.data.workshops.past %}
    <div class="event-card event-card--past">
      <h3>{{ event.name }}</h3>
      <p class="event-meta">{{ event.date | date: "%B %-d, %Y" }}</p>
      <div class="event-description">{{ event.descriptionHtml }}</div>
    </div>
    {% endfor %}
    {% endif %}

  </div>
</section>
```

---

## Step 5 — Update GitHub Actions

Replace `.github/workflows/jekyll-gh-pages.yml` with a version that runs the fetch script
before building:

```yaml
name: Deploy Jekyll to GitHub Pages

on:
  push:
    branches: ["master"]
  repository_dispatch:
    types: [sanity-publish] # triggered by Sanity webhook
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Fetch content from Sanity
        run: node scripts/fetch-sanity-data.js
        env:
          SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
          SANITY_DATASET: production
          SANITY_TOKEN: ${{ secrets.SANITY_TOKEN }}

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Build with Jekyll
        uses: actions/jekyll-build-pages@v1
        with:
          source: ./
          destination: ./_site

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Add these repository secrets in GitHub → Settings → Secrets → Actions:
- `SANITY_PROJECT_ID` — found in `sanity.config.js` or the Sanity dashboard
- `SANITY_TOKEN` — a "Viewer" API token from the Sanity dashboard

---

## Step 6 — Sanity Webhook (Auto-Deploy on Publish)

This makes the site rebuild automatically when Abbie hits "Publish" in Sanity Studio.

1. In the Sanity dashboard (manage.sanity.io), go to **API → Webhooks → Create webhook**
2. Set:
   - **Name:** GitHub Pages Deploy
   - **URL:** `https://api.github.com/repos/YOUR_ORG/abbiedigel/dispatches`
   - **Trigger on:** Document published
   - **HTTP method:** POST
   - **Headers:**
     - `Authorization: token YOUR_GITHUB_PAT`
       _(a GitHub personal access token with `repo` scope — store it safely)_
     - `Accept: application/vnd.github.v3+json`
   - **Body:**
     ```json
     {"event_type": "sanity-publish"}
     ```

With this in place, Abbie's publish action in Sanity triggers the `repository_dispatch` event
in GitHub Actions, which rebuilds and redeploys the site.

---

## Step 7 — Add `_config.yml`

Jekyll needs a config file. Create it at the repo root:

```yaml
# _config.yml
title: Abbie Digel
description: Creative workshops, book recommendations, and thoughtful information design.
url: "https://abbiedigel.com"

exclude:
  - node_modules/
  - studio/
  - scripts/
  - plan.md
  - "*.json"
  - package.json
  - package-lock.json
  - CLAUDE.md
  - README.md
```

---

## Step 8 — Deploy Sanity Studio

```bash
cd studio
npx sanity deploy
# ? Studio hostname: abbiedigel
# Studio available at: https://abbiedigel.sanity.studio
```

Abbie logs into `https://abbiedigel.sanity.studio` with her Sanity account to edit content.
Invite her under the Sanity project → Members → Add member (use the "Editor" role so she can
create, edit, and publish but not delete the project).

---

## Implementation Order

Do these in sequence — each step builds on the last.

1. **Create the Sanity project** (`npm create sanity@latest`) and define all schemas
2. **Deploy Sanity Studio** (`sanity deploy`) so the CMS is live
3. **Seed initial content** in Sanity Studio — enter the current homepage text, create a few
   book entries and lists, enter any known upcoming workshops
4. **Write `scripts/fetch-sanity-data.js`** and test it locally:
   ```bash
   SANITY_PROJECT_ID=xxx SANITY_DATASET=production SANITY_TOKEN=xxx node scripts/fetch-sanity-data.js
   # Verify _data/*.json files are written correctly
   ```
5. **Create `_layouts/` and `_includes/`**, convert all `.html` pages to use Liquid templates
6. **Test Jekyll locally:**
   ```bash
   gem install jekyll bundler
   bundle exec jekyll serve
   ```
7. **Add `_config.yml`** and update `.gitignore` to exclude `_data/` (it's generated at build time)
8. **Update `.github/workflows/jekyll-gh-pages.yml`** with the new build steps
9. **Add GitHub secrets** (`SANITY_PROJECT_ID`, `SANITY_TOKEN`)
10. **Push to master** — verify the Actions run succeeds and the live site renders CMS content
11. **Set up the Sanity webhook** for auto-deploy
12. **Test end-to-end:** Abbie publishes a change in Studio → site updates in ~90 seconds

---

## `.gitignore` Additions

```
_data/
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata
```

`_data/` is generated at build time and should not be committed to the repo.

---

## Fallback Behavior

If the Sanity fetch fails (network issue, bad token), the build will fail and the current
live site remains unchanged — GitHub Pages only replaces the old deployment on a successful
build. To make the build more resilient, catch errors in the fetch script and write empty
arrays / placeholder strings so Jekyll always has valid data to render.

---

## Rough Scope Estimate

| Task                                  | Complexity |
| ------------------------------------- | ---------- |
| Sanity project + schema setup         | Small      |
| `fetch-sanity-data.js` script         | Small      |
| Jekyll layout + template conversion   | Medium     |
| GitHub Actions update                 | Small      |
| CSS additions (book/event cards)      | Medium     |
| Webhook setup                         | Small      |
| Content seeding + testing             | Medium     |
