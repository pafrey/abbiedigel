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
    client.fetch(`*[_type == "homePage"][0]{ ..., "heroImage": heroImage.asset._ref }`),
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
    books: (list.books || []).map((b) => ({
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

  const homeData = {
    ...(homePage ?? {}),
    heroImage: imageUrl(homePage?.heroImage),
  }
  fs.writeFileSync(
    path.join(dataDir, 'home.json'),
    JSON.stringify(homeData, null, 2),
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

  console.log('book_lists.json:', JSON.stringify(bookListsWithUrls))
  console.log('Sanity data written to _data/')
}

fetchAll().catch((err) => {
  console.error(err)
  process.exit(1)
})
