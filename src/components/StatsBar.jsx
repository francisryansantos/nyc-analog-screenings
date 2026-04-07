import React from 'react'

const STATS = [
  { key: 'screenings', label: 'Screenings' },
  { key: 'films',      label: 'Unique Films' },
  { key: 'directors',  label: 'Directors' },
  { key: 'venues',     label: 'Venues' },
  { key: 'countries',  label: 'Countries' },
]

export default function StatsBar({ stats }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      borderBottom: '1px solid var(--border)',
    }}>
      {STATS.map(({ key, label }, i) => (
        <div key={key} style={{
          padding: '14px 16px',
          borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 'clamp(16px, 2vw, 22px)',
            fontWeight: 500,
            color: 'var(--bright)',
            letterSpacing: '-0.02em',
          }}>
            {stats[key].toLocaleString()}
          </div>
          <div style={{
            fontSize: '9px',
            color: 'var(--dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            marginTop: '3px',
          }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}
