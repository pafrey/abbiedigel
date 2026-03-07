# Book Recommendations Revamp Plan

## Goal

Replace the book-list–based layout with a flat gallery of all books, filterable by age range, theme, and moment (bedtime, read aloud, discussion). Each book card gets a dedicated "Why I love this book" field and a WorldCat search
button. Filtering is driven by a small inline JavaScript snippet (the only JS on the site).

---

## Summary of Changes

| Area | Change |
| ---- | ------ |
| Sanity schema (`book.ts`) | Update age-range values; rename description field; add `moment` field; remove `libraryNote` |
| Sanity schema (`bookList.ts`) | Delete — no longer used |
| `schemaTypes/index.ts` | Remove `bookList` import and registration |
| `scripts/fetch-sanity-data.js` | Replace book-list query with flat books query; write `books.json` |
| `book-recommendations.html` | Flat gallery with filter dropdowns; WorldCat button |
| `styles.css` | Gallery layout, filter bar, updated card styles |

---

## Step 1 — Update the Sanity Schema

### `abbie-digel/schemaTypes/book.ts`

Two changes:

1. **Age range values** — replace the numeric ranges with the new labels:
   `babies`, `toddlers`, `pre-school`, `K-2`, `3-5`

2. **Rename `description` → `whyILoveIt`** — gives the field a clear purpose in the Studio UI.
   Title becomes "Why I Love This Book".

3. **Remove `libraryNote`** — no longer displayed on the page.

Updated field list:

```ts
import {defineType, defineField, defineArrayMember} from 'sanity'
import {BookIcon} from '@sanity/icons'

export const book = defineType({
  name: 'book',
  title: 'Book',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'ageRange',
      title: 'Age Range',
      type: 'string',
      options: {
        list: ['babies', 'toddlers', 'pre-school', 'K-2', '3-5'],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'themes',
      title: 'Themes',
      description: 'e.g. nature, friendship, loss, curiosity',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'moment',
      title: 'Moment',
      description: 'e.g. bedtime, read-aloud, discussion',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'whyILoveIt',
      title: 'Why I Love This Book',
      type: 'text',
      rows: 4,
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'author', media: 'coverImage'},
  },
})
```

### Delete `abbie-digel/schemaTypes/bookList.ts`

The `bookList` document type is no longer needed. Delete the file.

### `abbie-digel/schemaTypes/index.ts`

Remove the `bookList` import and registration:

```ts
import {homePage} from './homePage'
import {aboutPage} from './aboutPage'
import {book} from './book'
import {workshop} from './workshop'

export const schemaTypes = [homePage, aboutPage, book, workshop]
```

### Deploy the updated schema

```bash
cd abbie-digel
npx sanity schema deploy
```

**Note on existing data:** Any books in Sanity that have the old `ageRange` values (`0–2`,
`2–4`, etc.) or the old `description` / `libraryNote` fields will need to be re-entered or
migrated. The old `bookList` documents can be deleted in the Studio after deployment.

---

## Step 2 — Update the Fetch Script

Replace the book-list query with a flat query for all books. Collect all unique themes
across all books so the template can build the theme filter dropdown.

Update `scripts/fetch-sanity-data.js`:

- Remove the `bookLists` fetch and `book_lists.json` output.
- Add a flat `books` fetch that includes `title`, `author`, `ageRange`, `themes`, `moment`,
  `whyILoveIt`, and `coverImage`.
- Write `_data/books.json` as a flat array.
- Derive `_data/book_meta.json` containing the sorted list of unique themes and the ordered
  age-range labels (for building the dropdowns in Jekyll without JS).

```js
// Replace the bookLists fetch with:
const books = await client.fetch(`
  *[_type == "book"] | order(title asc) {
    title,
    author,
    ageRange,
    themes,
    moment,
    whyILoveIt,
    "coverImage": coverImage.asset._ref
  }
`)

// Resolve cover image URLs
const booksWithUrls = books.map((b) => ({
  ...b,
  coverImage: imageUrl(b.coverImage),
}))

// Collect all unique themes and moments, sorted
const allThemes = [...new Set(
  booksWithUrls.flatMap((b) => b.themes ?? [])
)].sort()

const allMoments = [...new Set(
  booksWithUrls.flatMap((b) => b.moment ?? [])
)].sort()

// Write output files
fs.writeFileSync(
  path.join(dataDir, 'books.json'),
  JSON.stringify(booksWithUrls, null, 2),
)
fs.writeFileSync(
  path.join(dataDir, 'book_meta.json'),
  JSON.stringify({
    ageRanges: ['babies', 'toddlers', 'pre-school', 'K-2', '3-5'],
    themes: allThemes,
    moments: allMoments,
  }, null, 2),
)
```

Remove `book_lists.json` from the output entirely.

---

## Step 3 — Rewrite `book-recommendations.html`

Replace the book-list loop with a flat gallery. Jekyll renders every book as a card with
`data-age` and `data-themes` attributes; a small `<script>` block handles live filtering.

```html
---
layout: base
title: Book Recommendations
---

<section class="page-header">
  <div class="container">
    <h1>Book Recommendations</h1>

    <div class="book-filters">
      <label for="filter-age">Age range</label>
      <select id="filter-age">
        <option value="">All ages</option>
        {% for age in site.data.book_meta.ageRanges %}
        <option value="{{ age }}">{{ age }}</option>
        {% endfor %}
      </select>

      <label for="filter-theme">Theme</label>
      <select id="filter-theme">
        <option value="">All themes</option>
        {% for theme in site.data.book_meta.themes %}
        <option value="{{ theme }}">{{ theme }}</option>
        {% endfor %}
      </select>

      <label for="filter-moment">Moment</label>
      <select id="filter-moment">
        <option value="">All moments</option>
        {% for moment in site.data.book_meta.moments %}
        <option value="{{ moment }}">{{ moment }}</option>
        {% endfor %}
      </select>
    </div>

    <p class="book-count" id="book-count"></p>

    <div class="book-gallery" id="book-gallery">
      {% for book in site.data.books %}
      <div
        class="book-card"
        data-age="{{ book.ageRange }}"
        data-themes="{{ book.themes | join: ',' }}"
        data-moments="{{ book.moment | join: ',' }}"
      >
        {% if book.coverImage %}
        <img src="{{ book.coverImage }}" alt="Cover of {{ book.title }}" class="book-cover" />
        {% endif %}
        <div class="book-info">
          <h3>{{ book.title }}</h3>
          <p class="book-author">by {{ book.author }}</p>
          {% if book.ageRange %}<p class="book-age">{{ book.ageRange }}</p>{% endif %}
          {% if book.themes %}
          <p class="book-themes">
            {% for theme in book.themes %}<span class="tag">{{ theme }}</span>{% endfor %}
          </p>
          {% endif %}
          {% if book.whyILoveIt %}
          <p class="book-why">{{ book.whyILoveIt }}</p>
          {% endif %}
          <a
            href="https://search.worldcat.org/search?q={{ book.title | append: ' ' | append: book.author | url_encode }}"
            class="worldcat-link"
            target="_blank"
            rel="noopener"
          >Find in a library →</a>
        </div>
      </div>
      {% endfor %}
    </div>

    <p class="no-results" id="no-results" style="display:none">
      No books match those filters.
    </p>
  </div>
</section>

<script>
  (function () {
    const ageSelect = document.getElementById('filter-age')
    const themeSelect = document.getElementById('filter-theme')
    const momentSelect = document.getElementById('filter-moment')
    const cards = Array.from(document.querySelectorAll('.book-card'))
    const countEl = document.getElementById('book-count')
    const noResults = document.getElementById('no-results')

    function update() {
      const age = ageSelect.value
      const theme = themeSelect.value
      const moment = momentSelect.value
      let visible = 0
      cards.forEach((card) => {
        const matchAge = !age || card.dataset.age === age
        const themes = card.dataset.themes ? card.dataset.themes.split(',') : []
        const matchTheme = !theme || themes.includes(theme)
        const moments = card.dataset.moments ? card.dataset.moments.split(',') : []
        const matchMoment = !moment || moments.includes(moment)
        const show = matchAge && matchTheme && matchMoment
        card.style.display = show ? '' : 'none'
        if (show) visible++
      })
      countEl.textContent = `${visible} book${visible === 1 ? '' : 's'}`
      noResults.style.display = visible === 0 ? '' : 'none'
    }

    ageSelect.addEventListener('change', update)
    themeSelect.addEventListener('change', update)
    momentSelect.addEventListener('change', update)
    update()
  })()
</script>
```

---

## Step 4 — Update `styles.css`

Add / update these rules. Preserve all existing variables and patterns.

### Filter bar

```css
.book-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.book-filters label {
  font-size: 0.875rem;
  color: #717254;
  font-weight: 500;
}

.book-filters select {
  padding: 0.4rem 0.75rem;
  border: 1px solid #cecdcd;
  border-radius: 4px;
  background: #f4f1ec;
  color: #717254;
  font-size: 0.875rem;
  cursor: pointer;
}

.book-count {
  font-size: 0.875rem;
  color: #717254;
  margin-bottom: 1.5rem;
}
```

### Gallery grid (replaces `.book-grid`)

```css
.book-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 2rem;
}
```

### Book card updates

```css
/* Keep existing .book-card, .book-cover, .book-author, .book-age, .book-themes, .tag */

.book-why {
  font-size: 0.9rem;
  color: #717254;
  margin: 0.5rem 0 0.75rem;
  line-height: 1.5;
}

.worldcat-link {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #717254;
  text-decoration: underline;
}

.worldcat-link:hover {
  color: #5a5a40;
}

.no-results {
  color: #717254;
  padding: 2rem 0;
}
```

---

## Step 5 — Update `_config.yml`

Remove `book_lists.json` from the exclude list if it was listed. No other config changes needed.

---

## Implementation Order

1. Update `abbie-digel/schemaTypes/book.ts` with new age ranges, renamed field, removed field
2. Delete `abbie-digel/schemaTypes/bookList.ts`
3. Update `abbie-digel/schemaTypes/index.ts` to remove `bookList`
4. Run `npx sanity schema deploy` from `abbie-digel/`
5. Re-enter / migrate book content in the Studio (update age ranges, fill in `whyILoveIt`)
6. Update `scripts/fetch-sanity-data.js` (flat books query, write `books.json` + `book_meta.json`)
7. Test fetch locally:
   ```bash
   SANITY_PROJECT_ID=h0v4uijz SANITY_DATASET=production SANITY_TOKEN=xxx node scripts/fetch-sanity-data.js
   # Verify _data/books.json and _data/book_meta.json
   ```
8. Rewrite `book-recommendations.html`
9. Add filter/gallery CSS to `styles.css`
10. Test with `bundle exec jekyll serve`
11. Push to master — verify the Actions build and live site
