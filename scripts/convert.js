#!/usr/bin/env node
/**
 * Convert data/all_screenings.csv → src/data.json
 * Keeps only the columns needed by the app.
 * Run automatically as `prebuild` in package.json.
 */

const fs   = require('fs')
const path = require('path')

const KEEP = new Set(['date', 'film_title', 'year', 'director', 'format',
                      'country', 'original_language', 'venue', 'genres'])

// ── CSV parser (handles quoted fields containing commas / newlines) ────────────
function parseCSV(text) {
  const rows   = []
  let field    = ''
  let inQuotes = false
  let row      = []

  for (let i = 0; i < text.length; i++) {
    const ch   = text[i]
    const next = text[i + 1]

    if (ch === '"') {
      if (inQuotes && next === '"') { field += '"'; i++ }   // escaped quote
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      row.push(field); field = ''
    } else if ((ch === '\n' || (ch === '\r' && next === '\n')) && !inQuotes) {
      if (ch === '\r') i++
      row.push(field); field = ''
      rows.push(row);  row = []
    } else {
      field += ch
    }
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}

const csvPath = path.join(__dirname, '..', 'data', 'all_screenings.csv')
const outPath = path.join(__dirname, '..', 'src', 'data.json')

const text    = fs.readFileSync(csvPath, 'utf8')
const rows    = parseCSV(text)
const headers = rows[0]

const records = rows.slice(1)
  .map(cols => {
    const obj = {}
    headers.forEach((h, i) => { if (KEEP.has(h)) obj[h] = (cols[i] || '').trim() })
    return obj
  })
  .filter(r => r.film_title)

fs.writeFileSync(outPath, JSON.stringify(records), 'utf8')
console.log(`✓  Converted ${records.length.toLocaleString()} rows → src/data.json`)
