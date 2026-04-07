import React, { forwardRef, useState } from 'react'

const SearchBar = forwardRef(function SearchBar({ value, onChange }, ref) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ position: 'relative', maxWidth: '520px' }}>
      <span style={{
        position: 'absolute', left: '13px', top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--dim)',
        fontSize: '15px',
        pointerEvents: 'none',
        lineHeight: 1,
      }}>
        ⌕
      </span>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search films, directors, countries… ( press / )"
        style={{
          width: '100%',
          background: 'var(--bg2)',
          border: `1px solid ${focused ? 'var(--red)' : 'var(--border)'}`,
          color: 'var(--bright)',
          fontFamily: 'var(--mono)',
          fontSize: '12px',
          padding: '10px 36px 10px 34px',
          outline: 'none',
          borderRadius: 0,
          letterSpacing: '0.02em',
        }}
        spellCheck={false}
        autoComplete="off"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute', right: '10px', top: '50%',
            transform: 'translateY(-50%)',
            background: 'none', border: 'none',
            color: 'var(--dim)', fontSize: '14px', padding: '2px 4px',
          }}
          title="Clear"
        >
          ✕
        </button>
      )}
    </div>
  )
})

export default SearchBar
