import React, { useMemo } from 'react'

const TOP_N = 100

function getKey(row, groupBy) {
  switch (groupBy) {
    case 'film':      return row.film_title ? `${row.film_title}${row.year ? ` (${row.year})` : ''}` : null
    case 'director':  return row.director   || null
    case 'venue':     return row.venue      || null
    case 'country':   return null   // handled separately (multi-value)
    case 'format':    return row.format     || null
    default:          return null
  }
}

export default function RankingTab({ data, groupBy, onFilter, filterKey }) {
  const rankings = useMemo(() => {
    const counts = {}
    data.forEach(row => {
      let keys
      if (groupBy === 'country') {
        // Split multi-country strings into individual entries
        keys = row.country ? row.country.split(', ').filter(Boolean) : []
      } else {
        const k = getKey(row, groupBy)
        keys = k ? [k] : []
      }
      keys.forEach(k => { counts[k] = (counts[k] || 0) + 1 })
    })

    return Object.entries(counts)
      .filter(([k]) => k)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)
  }, [data, groupBy])

  const maxCount = rankings[0]?.[1] || 1
  const total    = data.length

  if (rankings.length === 0) {
    return (
      <div style={{ padding: '40px 0', color: 'var(--dim)', fontSize: '12px', letterSpacing: '0.06em' }}>
        No data for current filters.
      </div>
    )
  }

  return (
    <div style={{ paddingTop: '1px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 60px 48px',
        gap: '0',
        borderBottom: '1px solid var(--border2)',
        padding: '8px 0',
      }}>
        <span style={{ fontSize: '9px', color: 'var(--dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>#</span>
        <span style={{ fontSize: '9px', color: 'var(--dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Name</span>
        <span style={{ fontSize: '9px', color: 'var(--dim)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>Count</span>
        <span style={{ fontSize: '9px', color: 'var(--dim)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>Share</span>
      </div>

      {rankings.map(([name, count], i) => {
        const barPct = (count / maxCount * 100).toFixed(1)
        const sharePct = (count / total * 100).toFixed(1)
        const isFilm = groupBy === 'film'
        const clickable = !!filterKey && !!onFilter

        // For film groupBy, extract the raw title (strip year suffix) for filtering
        const filterValue = groupBy === 'film'
          ? name.replace(/ \(\d{4}\)$/, '')
          : name

        return (
          <div
            key={name}
            onClick={() => { if (clickable) onFilter(filterKey, filterValue) }}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr 60px 48px',
              gap: '0',
              padding: '10px 0',
              borderBottom: '1px solid var(--border)',
              cursor: clickable ? 'pointer' : 'default',
              alignItems: 'center',
            }}
            onMouseEnter={e => { if (clickable) e.currentTarget.style.background = 'var(--bg2)' }}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Rank */}
            <span style={{ fontSize: '10px', color: 'var(--dim)', fontVariantNumeric: 'tabular-nums' }}>
              {i + 1}
            </span>

            {/* Name + bar */}
            <div style={{ minWidth: 0, paddingRight: '16px' }}>
              <div style={{
                fontFamily: isFilm ? 'var(--serif)' : 'var(--mono)',
                fontSize: isFilm ? '14px' : '12px',
                color: 'var(--bright)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                marginBottom: '4px',
              }}>
                {name}
              </div>
              <div style={{ height: '2px', background: 'var(--border)' }}>
                <div style={{
                  height: '100%',
                  width: `${barPct}%`,
                  background: i === 0 ? 'var(--red)' : 'var(--border2)',
                  transition: 'width 0.2s',
                }} />
              </div>
            </div>

            {/* Count */}
            <span style={{
              fontSize: '12px', color: 'var(--text)',
              textAlign: 'right', fontVariantNumeric: 'tabular-nums',
            }}>
              {count.toLocaleString()}
            </span>

            {/* Share */}
            <span style={{
              fontSize: '10px', color: 'var(--dim)',
              textAlign: 'right', fontVariantNumeric: 'tabular-nums',
            }}>
              {sharePct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
