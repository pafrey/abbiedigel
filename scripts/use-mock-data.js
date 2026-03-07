// scripts/use-mock-data.js
// Copies _data-mock/*.json into _data/ for local Jekyll development.
// Run with: npm run mock

import fs from 'fs'

fs.mkdirSync('_data', { recursive: true })
for (const file of fs.readdirSync('_data-mock')) {
  fs.copyFileSync(`_data-mock/${file}`, `_data/${file}`)
}
console.log('Mock data copied to _data/')
