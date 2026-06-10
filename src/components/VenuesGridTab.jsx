import React, { useState, useMemo, useEffect } from 'react'

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

function aggregateVenues(data) {
  const map = {}
  data.forEach(r => {
    if (!r.venue) return
    if (!map[r.venue]) {
      map[r.venue] = {
        rows: 0,
        formats: {},
        directors: {},
        countries: {},
        years: {},
        eras: {},
        filmCounts: {},
        films: new Set(),
      }
    }
    const v = map[r.venue]
    v.rows += 1
    if (r.format)   v.formats[r.format]     = (v.formats[r.format]     || 0) + 1
    if (r.director) v.directors[r.director] = (v.directors[r.director] || 0) + 1
    if (r.country) {
      r.country.split(', ').forEach(c => {
        if (c) v.countries[c] = (v.countries[c] || 0) + 1
      })
    }
    if (r.screening_year) v.years[r.screening_year] = (v.years[r.screening_year] || 0) + 1
    const releaseYear = parseInt(r.year, 10)
    if (releaseYear >= 1880 && releaseYear <= 2030) {
      const decade = Math.floor(releaseYear / 10) * 10
      v.eras[decade] = (v.eras[decade] || 0) + 1
    }
    if (r.film_title) {
      const label = r.film_title + (r.year ? ` (${r.year})` : '')
      v.films.add(label)
      v.filmCounts[label] = (v.filmCounts[label] || 0) + 1
    }
  })

  const topN = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n)

  return Object.entries(map).map(([name, v]) => {
    const yearKeys = Object.keys(v.years).sort()
    return {
      name,
      screenings:   v.rows,
      films:        v.films.size,
      directors:    Object.keys(v.directors).length,
      topFilm:      (topN(v.filmCounts, 1)[0] || ['—'])[0],
      topDirector:  (topN(v.directors, 1)[0]  || ['—'])[0],
      topFormats:   topN(v.formats,   5),
      topDirectors: topN(v.directors, 5),
      topCountries: topN(v.countries, 5),
      timeline:     yearKeys.map(y => ({ year: y, value: v.years[y] })),
      // raw sets/maps used by the comparison view
      eras:          v.eras,
      filmsSet:      v.films,
      filmCountsMap: v.filmCounts,
      directorsMap:  v.directors,
    }
  })
    .filter(v => v.screenings >= 5)
    .sort((a, b) => b.screenings - a.screenings)
}

function Sparkline({ data }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const width = 200
  const height = 32
  const barW = width / data.length

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
        style={{ width: '100%', height: '32px', display: 'block' }}>
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * height, 1)
          return (
            <rect
              key={d.year}
              x={i * barW + 0.5}
              y={height - h}
              width={Math.max(barW - 1, 1)}
              height={h}
              fill="var(--red)"
              opacity={0.55}
            />
          )
        })}
      </svg>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '9px',
        color: 'var(--dim)',
        marginTop: '3px',
        letterSpacing: '0.05em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        <span>{data[0].year}</span>
        <span>{data[data.length - 1].year}</span>
      </div>
    </div>
  )
}

function VenueCard({ venue, selected, selectable, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: '1px solid ' + (selected ? 'var(--red)' : 'var(--border)'),
        background: selected ? 'var(--bg2)' : 'transparent',
        padding: '18px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        if (selected) return
        e.currentTarget.style.borderColor = 'var(--border2)'
        e.currentTarget.style.background = 'var(--bg2)'
      }}
      onMouseLeave={e => {
        if (selected) return
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <div style={{
        fontFamily: 'var(--serif)',
        fontSize: '17px',
        color: 'var(--bright)',
        marginBottom: '14px',
        fontWeight: 600,
        lineHeight: 1.2,
      }}>
        {venue.name}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        marginBottom: '14px',
      }}>
        {[
          ['Screenings', venue.screenings],
          ['Films',      venue.films],
          ['Directors',  venue.directors],
        ].map(([label, value]) => (
          <div key={label}>
            <div style={{
              fontSize: '14px',
              color: 'var(--bright)',
              fontVariantNumeric: 'tabular-nums',
              marginBottom: '2px',
            }}>
              {value.toLocaleString()}
            </div>
            <div style={{
              fontSize: '8px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--dim)',
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '11px', marginBottom: '14px', lineHeight: 1.7 }}>
        {[
          ['Most shown',   venue.topFilm],
          ['Top director', venue.topDirector],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ color: 'var(--dim)', flexShrink: 0 }}>{label}</span>
            <span style={{
              color: 'var(--text)',
              textAlign: 'right',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Sparkline data={venue.timeline} />
      </div>

      {selectable && (
        <div style={{
          marginTop: '10px',
          fontSize: '9px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: selected ? 'var(--red2)' : 'var(--dim)',
        }}>
          {selected ? '✓ Selected' : 'Click to compare'}
        </div>
      )}
    </div>
  )
}

const COMPARE_COLORS = ['#e02424', '#d4a946', '#42a394']

const SECTION_TITLE = {
  fontFamily: 'var(--mono)',
  fontSize: '9px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--dim)',
  marginBottom: '10px',
  fontWeight: 400,
}

function EraOverlay({ venues }) {
  const allDecades = new Set()
  venues.forEach(v => {
    Object.keys(v.eras).forEach(d => allDecades.add(Number(d)))
  })
  if (allDecades.size === 0) return null

  const sorted = [...allDecades].sort((a, b) => a - b)
  const range = []
  for (let d = sorted[0]; d <= sorted[sorted.length - 1]; d += 10) range.push(d)

  // Use share (percentage of each venue's own screenings) so size doesn't dominate
  let maxPct = 0
  venues.forEach(v => {
    range.forEach(d => {
      const pct = (v.eras[d] || 0) / v.screenings
      if (pct > maxPct) maxPct = pct
    })
  })

  return (
    <div style={{ marginBottom: '24px' }}>
      <h4 style={SECTION_TITLE}>
        Era profile
        <span style={{ color: 'var(--text)', marginLeft: '8px', textTransform: 'none', letterSpacing: 0 }}>
          % of each venue's screenings by film decade
        </span>
      </h4>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {venues.map((v, i) => (
          <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '11px', height: '11px',
              background: COMPARE_COLORS[i],
              opacity: 0.8,
            }} />
            <span style={{ fontSize: '11px', color: 'var(--text)' }}>{v.name}</span>
          </div>
        ))}
      </div>

      {/* Grouped bars per decade */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${range.length}, 1fr)`,
        gap: '4px',
        height: '110px',
        alignItems: 'end',
      }}>
        {range.map(d => (
          <div key={d} style={{
            display: 'flex',
            gap: '2px',
            alignItems: 'flex-end',
            height: '100%',
          }}>
            {venues.map((v, i) => {
              const pct = (v.eras[d] || 0) / v.screenings
              const h = (pct / maxPct) * 100
              return (
                <div key={v.name} style={{
                  flex: 1,
                  height: `${h}%`,
                  background: COMPARE_COLORS[i],
                  opacity: 0.75,
                  minHeight: pct > 0 ? '1px' : 0,
                }} />
              )
            })}
          </div>
        ))}
      </div>

      {/* Decade labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${range.length}, 1fr)`,
        gap: '4px',
        marginTop: '6px',
      }}>
        {range.map(d => (
          <span key={d} style={{
            fontSize: '9px',
            color: 'var(--dim)',
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.05em',
          }}>
            '{String(d).slice(-2)}
          </span>
        ))}
      </div>
    </div>
  )
}

function SharedList({ items, venues }) {
  const narrow = useIsNarrow()
  const LIMIT = 50
  const shown = items.slice(0, LIMIT)
  const n = venues.length
  const colWidth = narrow ? '32px' : '48px'
  const countCols = Array(n).fill(colWidth).join(' ')
  const gap = narrow ? '6px' : '12px'

  return (
    <div style={{
      padding: '10px 0 14px',
      borderBottom: '1px solid var(--border)',
    }}>
      {shown.map(item => (
        <div key={item.name} style={{
          display: 'grid',
          gridTemplateColumns: `minmax(0, 1fr) ${countCols}`,
          gap,
          padding: '4px 0',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: '11px',
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {item.name}
          </span>
          {item.counts.map((c, i) => (
            <span key={i} style={{
              fontSize: '11px',
              color: COMPARE_COLORS[i],
              fontVariantNumeric: 'tabular-nums',
              textAlign: 'right',
            }} title={`${c} at ${venues[i].name}`}>
              {c}
            </span>
          ))}
        </div>
      ))}
      {items.length > LIMIT && (
        <div style={{
          fontSize: '10px',
          color: 'var(--dim)',
          textAlign: 'center',
          padding: '8px 0 2px',
          letterSpacing: '0.05em',
        }}>
          + {(items.length - LIMIT).toLocaleString()} more
        </div>
      )}
    </div>
  )
}

function OverlapStats({ venues }) {
  const [expanded, setExpanded] = useState(null) // 'films' | 'directors' | null
  const narrow = useIsNarrow()
  const n = venues.length

  // Items present in all selected venues
  const sharedFilms = useMemo(() => {
    const labels = [...venues[0].filmsSet].filter(f =>
      venues.every(v => v.filmsSet.has(f)))
    return labels
      .map(name => ({
        name,
        counts: venues.map(v => v.filmCountsMap[name] || 0),
      }))
      .sort((x, y) => sum(y.counts) - sum(x.counts))
  }, [venues])

  const sharedDirectors = useMemo(() => {
    const names = Object.keys(venues[0].directorsMap).filter(d =>
      venues.every(v => v.directorsMap[d]))
    return names
      .map(name => ({
        name,
        counts: venues.map(v => v.directorsMap[name] || 0),
      }))
      .sort((x, y) => sum(y.counts) - sum(x.counts))
  }, [venues])

  // Items unique to each venue (in that venue, not in any other)
  const onlyCounts = (kind) => venues.map((v, i) => {
    const has = (other, item) =>
      kind === 'films' ? other.filmsSet.has(item) : !!other.directorsMap[item]
    const items = kind === 'films' ? v.filmsSet : Object.keys(v.directorsMap)
    let c = 0
    items.forEach(item => {
      const inOther = venues.some((o, j) => j !== i && has(o, item))
      if (!inOther) c += 1
    })
    return c
  })

  const filmOnlys     = useMemo(() => onlyCounts('films'),     [venues])
  const directorOnlys = useMemo(() => onlyCounts('directors'), [venues])

  const rows = [
    { key: 'films',     label: 'Films',     onlys: filmOnlys,     shared: sharedFilms.length,     list: sharedFilms },
    { key: 'directors', label: 'Directors', onlys: directorOnlys, shared: sharedDirectors.length, list: sharedDirectors },
  ]

  const sharedLabel = n === 2 ? 'Shared' : 'Shared by all'
  // For 2 venues keep the Venn-like layout: only A | Shared | only B.
  // For 3+ venues put Shared at the end after the "only" columns.
  const labelCol = narrow ? '60px' : '90px'
  const cols = `${labelCol} ` + Array(n + 1).fill('1fr').join(' ')
  const cellGap = narrow ? '6px' : '12px'

  const renderHeader = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: cols,
      gap: cellGap,
      padding: '6px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div />
      {n === 2 ? (
        <>
          <HeaderCell color={COMPARE_COLORS[0]}>{venues[0].name} only</HeaderCell>
          <HeaderCell color="var(--text)">{sharedLabel}</HeaderCell>
          <HeaderCell color={COMPARE_COLORS[1]}>{venues[1].name} only</HeaderCell>
        </>
      ) : (
        <>
          {venues.map((v, i) => (
            <HeaderCell key={v.name} color={COMPARE_COLORS[i]}>{v.name} only</HeaderCell>
          ))}
          <HeaderCell color="var(--text)">{sharedLabel}</HeaderCell>
        </>
      )}
    </div>
  )

  return (
    <div style={{ marginBottom: '24px' }}>
      <h4 style={SECTION_TITLE}>Overlap</h4>
      {renderHeader()}

      {rows.map(row => {
        const isExpanded = expanded === row.key
        const canExpand  = row.shared > 0

        const sharedCell = (
          <div
            key="shared"
            onClick={canExpand ? () => setExpanded(isExpanded ? null : row.key) : undefined}
            style={{
              textAlign: 'center',
              fontFamily: 'var(--mono)',
              fontSize: '14px',
              color: 'var(--bright)',
              fontVariantNumeric: 'tabular-nums',
              cursor: canExpand ? 'pointer' : 'default',
              display: 'inline-flex',
              justifyContent: 'center',
              gap: '6px',
              alignItems: 'baseline',
              width: '100%',
            }}
            title={canExpand ? (isExpanded ? 'Hide list' : `Show ${row.shared.toLocaleString()} shared ${row.label.toLowerCase()}`) : undefined}
          >
            <span style={{
              borderBottom: canExpand ? '1px dotted var(--dim)' : 'none',
              paddingBottom: '1px',
            }}>
              {row.shared.toLocaleString()}
            </span>
            {canExpand && (
              <span style={{ fontSize: '9px', color: 'var(--dim)' }}>
                {isExpanded ? '▴' : '▾'}
              </span>
            )}
          </div>
        )

        const onlyCells = row.onlys.map((c, i) => (
          <NumberCell key={i} value={c} color={COMPARE_COLORS[i]} />
        ))

        return (
          <React.Fragment key={row.key}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: cols,
              gap: '12px',
              padding: '10px 0',
              borderBottom: isExpanded ? 'none' : '1px solid var(--border)',
              alignItems: 'center',
            }}>
              <div style={{
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--dim)',
              }}>
                {row.label}
              </div>
              {n === 2
                ? [onlyCells[0], sharedCell, onlyCells[1]]
                : [...onlyCells, sharedCell]}
            </div>

            {isExpanded && <SharedList items={row.list} venues={venues} />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function sum(arr) { return arr.reduce((a, b) => a + b, 0) }

function HeaderCell({ color, children }) {
  return (
    <div style={{
      fontSize: '9px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color,
      textAlign: 'center',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      minWidth: 0,
    }}>
      {children}
    </div>
  )
}

function NumberCell({ value, color }) {
  return (
    <div style={{
      textAlign: 'center',
      fontFamily: 'var(--mono)',
      fontSize: '14px',
      color,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {value.toLocaleString()}
    </div>
  )
}

function ComparisonPanel({ venues, onClear }) {
  const narrow = useIsNarrow()
  if (venues.length < 2) return null

  const Block = ({ title, items, total }) => (
    <div style={{ marginBottom: '18px' }}>
      <h4 style={{
        fontFamily: 'var(--mono)',
        fontSize: '9px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--dim)',
        marginBottom: '8px',
        fontWeight: 400,
      }}>
        {title}
      </h4>
      {items.length === 0 && (
        <div style={{ fontSize: '11px', color: 'var(--dim)' }}>—</div>
      )}
      {items.map(([name, count]) => {
        const pct = (count / total * 100).toFixed(1)
        return (
          <div key={name} style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            padding: '3px 0',
            color: 'var(--text)',
            gap: '8px',
          }}>
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}>
              {name}
            </span>
            <span style={{
              color: 'var(--dim)',
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}>
              {count} · {pct}%
            </span>
          </div>
        )
      })}
    </div>
  )

  return (
    <div style={{
      border: '1px solid var(--border2)',
      padding: narrow ? '14px' : '20px',
      marginBottom: '24px',
      background: 'var(--bg2)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border)',
      }}>
        <h3 style={{
          fontFamily: 'var(--serif)',
          fontSize: '15px',
          color: 'var(--bright)',
          fontWeight: 700,
        }}>
          Comparing {venues.length} venues
        </h3>
        <button onClick={onClear} style={{
          background: 'none',
          border: '1px solid var(--border)',
          color: 'var(--dim)',
          fontSize: '9px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '5px 10px',
        }}>
          Clear
        </button>
      </div>

      <EraOverlay venues={venues} />

      <OverlapStats venues={venues} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: narrow ? '1fr' : `repeat(${venues.length}, 1fr)`,
        gap: narrow ? '20px' : '24px',
      }}>
        {venues.map((v, i) => (
          <div key={v.name} style={{
            borderTop: `2px solid ${COMPARE_COLORS[i]}`,
            paddingTop: '12px',
            minWidth: 0,
          }}>
            <div style={{
              fontFamily: 'var(--serif)',
              fontSize: '14px',
              color: 'var(--bright)',
              marginBottom: '4px',
              fontWeight: 600,
            }}>
              {v.name}
            </div>
            <div style={{
              fontSize: '10px',
              color: 'var(--dim)',
              marginBottom: '14px',
              letterSpacing: '0.05em',
            }}>
              {v.screenings.toLocaleString()} screenings · {v.films.toLocaleString()} films
            </div>
            <Block title="Top Directors" items={v.topDirectors} total={v.screenings} />
            <Block title="Top Countries" items={v.topCountries} total={v.screenings} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function VenuesGridTab({ data, onFilter }) {
  const [compareMode, setCompareMode] = useState(false)
  const [selected, setSelected] = useState([])
  const narrow = useIsNarrow()

  const venues = useMemo(() => aggregateVenues(data), [data])

  const selectedVenues = useMemo(
    () => selected.map(name => venues.find(v => v.name === name)).filter(Boolean),
    [selected, venues]
  )

  const handleCardClick = (name) => {
    if (compareMode) {
      setSelected(s => {
        if (s.includes(name)) return s.filter(n => n !== name)
        if (s.length >= 3)    return s
        return [...s, name]
      })
    } else {
      onFilter('venue', name)
    }
  }

  const toggleCompareMode = () => {
    setCompareMode(m => !m)
    setSelected([])
  }

  if (venues.length === 0) {
    return (
      <div style={{ padding: '40px 0', color: 'var(--dim)', fontSize: '12px', letterSpacing: '0.06em' }}>
        No venues for current filters.
      </div>
    )
  }

  return (
    <div style={{ paddingTop: '20px' }}>
      {/* Compare CTA banner */}
      <div style={{
        display: 'flex',
        flexDirection: narrow ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: narrow ? 'stretch' : 'center',
        gap: narrow ? '12px' : '16px',
        padding: narrow ? '14px' : '16px 18px',
        border: '1px solid ' + (compareMode ? 'var(--red)' : 'var(--border2)'),
        background: compareMode ? 'var(--bg2)' : 'transparent',
        marginBottom: '20px',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--serif)',
            fontSize: '15px',
            color: 'var(--bright)',
            fontWeight: 600,
            marginBottom: '3px',
          }}>
            {compareMode ? 'Compare mode active' : 'Compare venues side-by-side'}
          </div>
          <div style={{
            fontSize: '10px',
            color: 'var(--dim)',
            letterSpacing: '0.06em',
          }}>
            {compareMode
              ? `Click cards to add or remove · ${selected.length}/3 selected`
              : 'Pick up to 3 venues to see era profiles and shared films/directors'}
          </div>
        </div>
        <button
          onClick={toggleCompareMode}
          style={{
            background: compareMode ? 'var(--red)' : 'var(--bright)',
            border: 'none',
            color: compareMode ? 'var(--bright)' : 'var(--bg)',
            fontSize: '10px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            padding: '12px 20px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {compareMode ? 'Exit compare' : '⇄  Start comparing'}
        </button>
      </div>

      {/* Venue count strip */}
      <div style={{
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
        marginBottom: '20px',
        fontSize: '10px',
        color: 'var(--dim)',
        letterSpacing: '0.06em',
      }}>
        {venues.length.toLocaleString()} venues
      </div>

      <ComparisonPanel venues={selectedVenues} onClear={() => setSelected([])} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {venues.map(v => (
          <VenueCard
            key={v.name}
            venue={v}
            selected={selected.includes(v.name)}
            selectable={compareMode}
            onClick={() => handleCardClick(v.name)}
          />
        ))}
      </div>
    </div>
  )
}
