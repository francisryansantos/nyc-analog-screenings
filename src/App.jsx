import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import rawData from './data.json'
import SearchBar  from './components/SearchBar'
import StatsBar   from './components/StatsBar'
import FilterPanel from './components/FilterPanel'
import BrowseTab  from './components/BrowseTab'
import RankingTab from './components/RankingTab'

// Preprocess once: add screening_year, normalise country list
const data = rawData.map(r => ({
  ...r,
  screening_year: r.date ? r.date.slice(0, 4) : '',
}))

const TABS = [
  { id: 'browse',    label: 'Browse' },
  { id: 'films',     label: 'Top Films' },
  { id: 'directors', label: 'Top Directors' },
  { id: 'venues',    label: 'Venues' },
  { id: 'countries', label: 'Countries' },
  { id: 'formats',   label: 'Formats' },
]

// ── Filter options derived from full dataset ─────────────────────────────────
const ALL_OPTIONS = {
  formats:   [...new Set(data.map(r => r.format).filter(Boolean))].sort(),
  years:     [...new Set(data.map(r => r.screening_year).filter(Boolean))].sort().reverse(),
  languages: [...new Set(data.map(r => r.original_language).filter(Boolean))].sort(),
  venues:    [...new Set(data.map(r => r.venue).filter(Boolean))].sort(),
  // Individual countries (split multi-country strings)
  countries: [...new Set(
    data.flatMap(r => r.country ? r.country.split(', ') : []).filter(Boolean)
  )].sort(),
}

export default function App() {
  const [query,   setQuery]   = useState('')
  const [filters, setFilters] = useState({})
  const [tab,     setTab]     = useState('browse')
  const searchRef = useRef(null)

  // / → focus search, Esc → clear everything
  useEffect(() => {
    const onKey = e => {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setQuery('')
        setFilters({})
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Toggle a filter value (click again to clear)
  const setFilter = useCallback((key, value) => {
    setFilters(f => ({ ...f, [key]: f[key] === value ? undefined : value }))
  }, [])

  const clearFilters = useCallback(() => setFilters({}), [])

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const q = query.toLowerCase().trim()
    return data.filter(r => {
      if (q) {
        const hit = r.film_title.toLowerCase().includes(q) ||
                    r.director.toLowerCase().includes(q)   ||
                    r.country.toLowerCase().includes(q)
        if (!hit) return false
      }
      if (filters.director      && r.director          !== filters.director)           return false
      if (filters.venue         && r.venue              !== filters.venue)              return false
      if (filters.format        && r.format             !== filters.format)             return false
      if (filters.screening_year && r.screening_year   !== filters.screening_year)     return false
      if (filters.country       && !r.country.split(', ').includes(filters.country))   return false
      if (filters.language      && r.original_language !== filters.language)            return false
      return true
    })
  }, [query, filters])

  // ── Live stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    screenings: filteredData.length,
    films:      new Set(filteredData.map(r => r.film_title + '|' + r.year)).size,
    directors:  new Set(filteredData.map(r => r.director).filter(Boolean)).size,
    venues:     new Set(filteredData.map(r => r.venue).filter(Boolean)).size,
    countries:  new Set(filteredData.flatMap(r => r.country ? r.country.split(', ') : [])).size,
  }), [filteredData])

  const activeFilters = Object.entries(filters).filter(([, v]) => v)

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '36px 0 24px',
        marginBottom: '0',
      }}>
        <h1 style={{
          fontFamily: 'var(--serif)',
          fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
          fontWeight: 700,
          color: 'var(--bright)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          NYC Analog Screenings
        </h1>
      </header>

      <StatsBar stats={stats} />

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 0 0' }}>
        <SearchBar ref={searchRef} value={query} onChange={setQuery} />
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <FilterPanel
        filters={filters}
        options={ALL_OPTIONS}
        activeFilters={activeFilters}
        onFilter={setFilter}
        onClear={clearFilters}
      />

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginTop: '24px',
        overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none',
            border: 'none',
            borderBottom: tab === t.id ? '2px solid var(--red)' : '2px solid transparent',
            color: tab === t.id ? 'var(--bright)' : 'var(--dim)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '10px 18px',
            marginBottom: '-1px',
            whiteSpace: 'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      <div>
        {tab === 'browse' && (
          <BrowseTab data={filteredData} onFilter={setFilter} />
        )}
        {tab === 'films' && (
          <RankingTab data={filteredData} groupBy="film" onFilter={null} />
        )}
        {tab === 'directors' && (
          <RankingTab data={filteredData} groupBy="director" onFilter={setFilter} filterKey="director" />
        )}
        {tab === 'venues' && (
          <RankingTab data={filteredData} groupBy="venue" onFilter={setFilter} filterKey="venue" />
        )}
        {tab === 'countries' && (
          <RankingTab data={filteredData} groupBy="country" onFilter={setFilter} filterKey="country" />
        )}
        {tab === 'formats' && (
          <RankingTab data={filteredData} groupBy="format" onFilter={setFilter} filterKey="format" />
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        marginTop: '48px',
        padding: '20px 0',
        color: 'var(--dim)',
        fontSize: '11px',
        letterSpacing: '0.08em',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <span>
          Source:{' '}
          <a href="https://analogfilmnyc.org/" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--dim)', textDecoration: 'underline' }}>
            Analog Film NYC
          </a>
        </span>
        <span>
          Built by{' '}
          <a href="https://frsantos.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--dim)', textDecoration: 'underline' }}>
            Ryan Santos
          </a>
        </span>
      </footer>
    </div>
  )
}
