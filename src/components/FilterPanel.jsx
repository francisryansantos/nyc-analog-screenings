import React, { useState, useEffect, useRef } from 'react'

const GROUPS = [
  { key: 'format',         label: 'Format',   optKey: 'formats' },
  { key: 'screening_year', label: 'Year',      optKey: 'years' },
  { key: 'language',       label: 'Language',  optKey: 'languages' },
  { key: 'country',        label: 'Country',   optKey: 'countries' },
  { key: 'venue',          label: 'Venue',     optKey: 'venues' },
]

function Dropdown({ label, filterKey, options, active, onSelect, onClear }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); setSearch('') }}
        style={{
          background: active ? 'var(--red)' : 'var(--bg2)',
          border: `1px solid ${active ? 'var(--red)' : 'var(--border)'}`,
          color: active ? '#fff' : 'var(--dim)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '5px 10px',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}
      >
        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {active || label}
        </span>
        {active
          ? <span onClick={e => { e.stopPropagation(); onClear() }} style={{ opacity: 0.8, lineHeight: 1 }}>✕</span>
          : <span style={{ opacity: 0.6, fontSize: '8px' }}>{open ? '▲' : '▼'}</span>
        }
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0,
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          zIndex: 200, minWidth: '200px', maxWidth: '280px',
        }}>
          {options.length > 10 && (
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter…"
                style={{
                  width: '100%', background: 'none', border: 'none',
                  color: 'var(--bright)', fontFamily: 'var(--mono)',
                  fontSize: '11px', padding: '8px 12px', outline: 'none',
                }}
              />
            </div>
          )}
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {filtered.map(opt => (
              <div
                key={opt}
                onClick={() => { onSelect(opt); setOpen(false); setSearch('') }}
                style={{
                  padding: '7px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: active === opt ? 'var(--red2)' : 'var(--text)',
                  background: active === opt ? 'var(--bg3)' : 'transparent',
                  borderLeft: active === opt ? '2px solid var(--red)' : '2px solid transparent',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
                onMouseEnter={e => { if (active !== opt) e.currentTarget.style.background = 'var(--bg3)' }}
                onMouseLeave={e => { if (active !== opt) e.currentTarget.style.background = 'transparent' }}
              >
                {opt}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '10px 12px', color: 'var(--dim)', fontSize: '11px' }}>No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FilterPanel({ filters, options, activeFilters, onFilter, onClear }) {
  return (
    <div style={{ padding: '12px 0 0' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {GROUPS.map(({ key, label, optKey }) => (
          <Dropdown
            key={key}
            label={label}
            filterKey={key}
            options={options[optKey] || []}
            active={filters[key]}
            onSelect={val => onFilter(key, val)}
            onClear={() => onFilter(key, filters[key])}
          />
        ))}

        {/* Director chip (set by clicking names in table, not from dropdown) */}
        {filters.director && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--red)', padding: '5px 10px',
            fontSize: '10px', color: '#fff', letterSpacing: '0.06em',
          }}>
            <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {filters.director}
            </span>
            <span
              onClick={() => onFilter('director', filters.director)}
              style={{ cursor: 'pointer', opacity: 0.8 }}
            >✕</span>
          </div>
        )}

        {activeFilters.length > 0 && (
          <button
            onClick={onClear}
            style={{
              background: 'none', border: 'none',
              color: 'var(--dim)', fontSize: '10px',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '5px 8px',
            }}
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
