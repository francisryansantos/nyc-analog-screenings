import React, { useMemo, useState, useEffect } from 'react'

function useIsNarrow(breakpoint = 640) {
  const [narrow, setNarrow] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < breakpoint)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return narrow
}

function computeRanking(data, keyFn, limit) {
  const counts = {}
  data.forEach(row => {
    const keys = keyFn(row)
    keys.forEach(k => { if (k) counts[k] = (counts[k] || 0) + 1 })
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
}

const SECTION_TITLE = {
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--dim)',
  marginBottom: '10px',
  fontWeight: 400,
}

function EraHistogram({ data }) {
  const buckets = useMemo(() => {
    const counts = {}
    data.forEach(r => {
      const y = parseInt(r.year, 10)
      if (!y || y < 1880 || y > 2030) return
      const decade = Math.floor(y / 10) * 10
      counts[decade] = (counts[decade] || 0) + 1
    })
    const keys = Object.keys(counts).map(Number).sort((a, b) => a - b)
    if (keys.length === 0) return []

    const filled = []
    const min = keys[0]
    const maxK = keys[keys.length - 1]
    for (let d = min; d <= maxK; d += 10) {
      filled.push({ decade: d, value: counts[d] || 0 })
    }
    return filled
  }, [data])

  if (buckets.length === 0) return null
  const max = Math.max(...buckets.map(d => d.value), 1)
  const peak = buckets.reduce((a, b) => b.value > a.value ? b : a)

  return (
    <div>
      <h3 style={SECTION_TITLE}>
        Film era
        <span style={{ color: 'var(--text)', marginLeft: '8px', textTransform: 'none', letterSpacing: 0 }}>
          peak {String(peak.decade).slice(-2)}s · {peak.value}
        </span>
      </h3>

      {/* Bar heights (counts on top) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${buckets.length}, 1fr)`,
        gap: '3px',
        height: '102px',
        alignItems: 'end',
      }}>
        {buckets.map(d => {
          const heightPct = (d.value / max) * 90
          return (
            <div key={d.decade} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '100%',
            }}>
              <div style={{
                fontSize: '9px',
                color: 'var(--dim)',
                fontVariantNumeric: 'tabular-nums',
                marginBottom: '2px',
                minHeight: '10px',
              }}>
                {d.value > 0 ? d.value : ''}
              </div>
              <div style={{
                width: '100%',
                height: `${heightPct}%`,
                background: 'var(--red)',
                opacity: 0.6,
                minHeight: d.value > 0 ? '1px' : 0,
              }} />
            </div>
          )
        })}
      </div>

      {/* Decade labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${buckets.length}, 1fr)`,
        gap: '3px',
        marginTop: '4px',
      }}>
        {buckets.map(d => (
          <span key={d.decade} style={{
            fontSize: '9px',
            color: 'var(--dim)',
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.05em',
          }}>
            '{String(d.decade).slice(-2)}
          </span>
        ))}
      </div>
    </div>
  )
}

function MiniRanking({ title, entries, total, onClickEntry }) {
  const narrow = useIsNarrow()
  if (entries.length === 0) return null
  const max = entries[0][1]
  const cols = narrow ? '22px 1fr 42px 38px' : '28px 1fr 50px 44px'

  return (
    <div style={{ marginBottom: '36px' }}>
      <h3 style={{
        fontFamily: 'var(--mono)',
        fontSize: '10px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--dim)',
        marginBottom: '10px',
        fontWeight: 400,
      }}>
        {title}
      </h3>

      {entries.map(([name, count], i) => {
        const barPct = (count / max * 100).toFixed(1)
        const sharePct = (count / total * 100).toFixed(1)
        const clickable = !!onClickEntry

        return (
          <div
            key={name}
            onClick={() => { if (clickable) onClickEntry(name) }}
            style={{
              display: 'grid',
              gridTemplateColumns: cols,
              gap: '0',
              padding: '7px 0',
              borderBottom: '1px solid var(--border)',
              cursor: clickable ? 'pointer' : 'default',
              alignItems: 'center',
            }}
            onMouseEnter={e => { if (clickable) e.currentTarget.style.background = 'var(--bg2)' }}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '10px', color: 'var(--dim)', fontVariantNumeric: 'tabular-nums' }}>
              {i + 1}
            </span>
            <div style={{ minWidth: 0, paddingRight: '12px' }}>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                color: 'var(--bright)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                marginBottom: '3px',
              }}>
                {name}
              </div>
              <div style={{ height: '2px', background: 'var(--border)' }}>
                <div style={{
                  height: '100%',
                  width: `${barPct}%`,
                  background: 'var(--red)',
                  opacity: i === 0 ? 1 : 0.5,
                  transition: 'width 0.2s',
                }} />
              </div>
            </div>
            <span style={{
              fontSize: '12px', color: 'var(--text)',
              textAlign: 'right', fontVariantNumeric: 'tabular-nums',
            }}>
              {count.toLocaleString()}
            </span>
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

export default function VenueDetailTab({ data, venueName, onFilter, onBack }) {
  const narrow = useIsNarrow()
  const stats = useMemo(() => {
    const dates = data.map(r => r.date).filter(Boolean).sort()
    return {
      screenings: data.length,
      films: new Set(data.map(r => r.film_title + '|' + r.year)).size,
      directors: new Set(data.map(r => r.director).filter(Boolean)).size,
      firstDate: dates[0] || '—',
      lastDate: dates[dates.length - 1] || '—',
    }
  }, [data])

  const topFilms = useMemo(() =>
    computeRanking(data, r => {
      const k = r.film_title ? `${r.film_title}${r.year ? ` (${r.year})` : ''}` : null
      return k ? [k] : []
    }, 20),
  [data])

  const topDirectors = useMemo(() =>
    computeRanking(data, r => r.director ? [r.director] : [], 20),
  [data])

  const countries = useMemo(() =>
    computeRanking(data, r => r.country ? r.country.split(', ').filter(Boolean) : [], 20),
  [data])

  const genres = useMemo(() =>
    computeRanking(data, r => r.genres ? r.genres.split(', ').filter(Boolean) : [], 15),
  [data])

  const total = data.length

  if (total === 0) {
    return (
      <div style={{ padding: '40px 0', color: 'var(--dim)', fontSize: '12px', letterSpacing: '0.06em' }}>
        No screenings found for this venue.
      </div>
    )
  }

  return (
    <div style={{ paddingTop: '20px' }}>
      {/* Back + header */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--dim)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '0',
          marginBottom: '10px',
          cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--red2)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--dim)'}
      >
        &#8592; Back to venues
      </button>

      <h2 style={{
        fontFamily: 'var(--serif)',
        fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
        fontWeight: 700,
        color: 'var(--bright)',
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
        marginBottom: '16px',
      }}>
        {venueName}
      </h2>

      {/* Stats row */}
      <div style={{
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        marginBottom: '32px',
        padding: '12px 0',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        {[
          ['Screenings', stats.screenings],
          ['Films', stats.films],
          ['Directors', stats.directors],
          ['First', stats.firstDate],
          ['Last', stats.lastDate],
        ].map(([label, value]) => (
          <div key={label}>
            <div style={{
              fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--dim)', marginBottom: '2px',
            }}>
              {label}
            </div>
            <div style={{
              fontSize: '14px', color: 'var(--bright)', fontVariantNumeric: 'tabular-nums',
            }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          </div>
        ))}
      </div>

      {/* Film era histogram */}
      <div style={{ maxWidth: '520px', marginBottom: '36px' }}>
        <EraHistogram data={data} />
      </div>

      {/* Sub-rankings — side by side on desktop, stacked on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: narrow ? '1fr' : 'repeat(2, 1fr)',
        gap: narrow ? '0' : '0 32px',
      }}>
        <MiniRanking title="Top Films" entries={topFilms} total={total} onClickEntry={null} />
        <MiniRanking title="Top Directors" entries={topDirectors} total={total}
          onClickEntry={name => onFilter('director', name)} />
        <MiniRanking title="Countries" entries={countries} total={total}
          onClickEntry={name => onFilter('country', name)} />
        <MiniRanking title="Top Genres" entries={genres} total={total} onClickEntry={null} />
      </div>
    </div>
  )
}
