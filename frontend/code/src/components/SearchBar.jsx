import { useState } from 'react'

const styles = {
  wrapper: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  input: {
    flex: 1, padding: '0.6rem 1rem', borderRadius: '4px',
    border: '1px solid #ccc', fontSize: '1rem', outline: 'none',
  },
  btn: {
    padding: '0.6rem 1.2rem', background: '#1a3a5c', color: '#fff',
    border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '1rem',
  },
}

export default function SearchBar({ onSearch, placeholder = 'Rechercher…' }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} style={styles.wrapper}>
      <input
        style={styles.input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
      <button type="submit" style={styles.btn}>🔍 Rechercher</button>
    </form>
  )
}

