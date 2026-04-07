import React, { useState, useEffect } from 'react'

const PAGE = 75

const TH = ({ children }) => (
  <th style={{
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: '9px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--dim)',
    borderBottom: '1px solid var(--border2)',
    fontWeight: 400,
    whiteSpace: 'nowrap',
    background: 'var(--bg)',
    position: 'sticky',
    top: 0,
  }}>
    {children}
  </th>
)

const TD = ({ children, style }) => (
  <td style={{
    padding: '7px 12px',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'top',
    maxWidth: '220px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    ...style,
  }}>
    {children}
  </td>
)

function Clickable({ children, onClick }) {
  const [hovered, setHovered] = useState(false)
  if (!children) return null
  return (
    <span
      className="clickable"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ color: hovered ? 'var(--red2)' : 'inherit' }}
    >
      {children}
    </span>
  )
}

export default function BrowseTab({ data, onFilter }) {
  const [page, setPage] = useState(0)

  useEffect(() => { setPage(0) }, [data])

  const totalPages = Math.ceil(data.length / PAGE)
  const slice = data.slice(page * PAGE, (page + 1) * PAGE)

  return (
    <div>
      <div style={{
        padding: '10px 0',
        fontSize: '10px',
        color: 'var(--dim)',
        letterSpacing: '0.06em',
        borderBottom: '1px solid var(--border)',
      }}>
        {data.length.toLocaleString()} results
        {data.length > PAGE && ` · page ${page + 1} of ${totalPages}`}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
          <thead>
            <tr>
              <TH>Film</TH>
              <TH>Director</TH>
              <TH>Year</TH>
              <TH>Format</TH>
              <TH>Country</TH>
              <TH>Language</TH>
              <TH>Venue</TH>
              <TH>Date</TH>
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr
                key={i}
                style={{ background: i % 2 === 1 ? 'var(--bg2)' : 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 1 ? 'var(--bg2)' : 'transparent'}
              >
                <TD style={{ fontFamily: 'var(--serif)', fontSize: '13px', color: 'var(--bright)', maxWidth: '260px' }}>
                  {row.film_title}
                  {row.year && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', marginLeft: '6px' }}>
                      {row.year}
                    </span>
                  )}
                </TD>
                <TD>
                  <Clickable onClick={() => onFilter('director', row.director)}>
                    {row.director}
                  </Clickable>
                </TD>
                <TD style={{ color: 'var(--dim)' }}>{row.year}</TD>
                <TD style={{ color: 'var(--dim)' }}>{row.format}</TD>
                <TD>
                  <Clickable onClick={() => {
                    // Use first country in multi-country string
                    const first = row.country?.split(', ')[0]
                    if (first) onFilter('country', first)
                  }}>
                    {row.country}
                  </Clickable>
                </TD>
                <TD style={{ color: 'var(--text)' }}>{row.original_language}</TD>
                <TD>
                  <Clickable onClick={() => onFilter('venue', row.venue)}>
                    {row.venue}
                  </Clickable>
                </TD>
                <TD style={{ color: 'var(--dim)', fontSize: '11px' }}>{row.date}</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', padding: '16px 0', alignItems: 'center' }}>
          <PageBtn onClick={() => setPage(0)} disabled={page === 0}>«</PageBtn>
          <PageBtn onClick={() => setPage(p => p - 1)} disabled={page === 0}>‹ Prev</PageBtn>
          <span style={{ fontSize: '10px', color: 'var(--dim)', letterSpacing: '0.08em', padding: '0 4px' }}>
            {page + 1} / {totalPages}
          </span>
          <PageBtn onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next ›</PageBtn>
          <PageBtn onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>»</PageBtn>
        </div>
      )}
    </div>
  )
}

function PageBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        color: disabled ? 'var(--dim)' : 'var(--text)',
        fontSize: '11px',
        padding: '5px 12px',
      }}
    >
      {children}
    </button>
  )
}
