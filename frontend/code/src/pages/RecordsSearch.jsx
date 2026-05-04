import { useState } from 'react'
import { useLazyQuery } from '@apollo/client'
import { SEARCH_RECORDS } from '../graphql/queries'
import SearchBar from '../components/SearchBar'

const styles = {
  page: { padding: '2rem', maxWidth: '900px', margin: '0 auto' },
  h1: { color: '#1a3a5c', marginBottom: '0.5rem' },
  sub: { color: '#666', marginBottom: '2rem' },
  filters: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  select: { padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px' },
  input: { padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px' },
  result: { background: '#fff', borderRadius: '8px', padding: '1.2rem', marginBottom: '1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', display: 'flex', gap: '1rem' },
  img: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', background: '#e8f0fe', flexShrink: 0 },
  tag: { background: '#e8f0fe', color: '#1a3a5c', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 },
  total: { color: '#555', marginBottom: '1rem', fontSize: '0.9rem' },
}

export default function RecordsSearch() {
  const [filters, setFilters] = useState({ type: '', fromYear: '', toYear: '', country: '' })
  const [page, setPage] = useState(1)
  const [search, { data, loading }] = useLazyQuery(SEARCH_RECORDS)

  const handleSearch = (q) => {
    setPage(1)
    search({ variables: { query: q, filters, page: 1, limit: 20 } })
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>🔍 SuperSearch — Archives historiques</h1>
      <p style={styles.sub}>Recherchez parmi des millions de documents d'archives du monde entier.</p>

      <SearchBar onSearch={handleSearch} placeholder="Nom, prénom, lieu, date…" />

      <div style={styles.filters}>
        <select style={styles.select} value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">Tous les types</option>
          <option value="BIRTH">Naissance</option>
          <option value="MARRIAGE">Mariage</option>
          <option value="DEATH">Décès</option>
          <option value="CENSUS">Recensement</option>
          <option value="IMMIGRATION">Immigration</option>
        </select>
        <input style={styles.input} placeholder="Pays" value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })} />
        <input style={styles.input} type="number" placeholder="Année début" value={filters.fromYear} onChange={(e) => setFilters({ ...filters, fromYear: e.target.value })} />
        <input style={styles.input} type="number" placeholder="Année fin" value={filters.toYear} onChange={(e) => setFilters({ ...filters, toYear: e.target.value })} />
      </div>

      {loading && <div>Recherche en cours…</div>}

      {data?.searchRecords && (
        <>
          <div style={styles.total}>{data.searchRecords.total} résultat(s) trouvé(s)</div>
          {data.searchRecords.results.map((r) => (
            <div key={r.id} style={styles.result}>
              {r.imageUrl ? <img src={r.imageUrl} alt={r.title} style={styles.img} /> : <div style={styles.img} />}
              <div>
                <div style={{ marginBottom: '0.3rem' }}><span style={styles.tag}>{r.type}</span></div>
                <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{r.firstName} {r.lastName}</div>
                <div style={{ color: '#333', marginBottom: '0.3rem' }}>{r.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>{r.date} {r.place && `— ${r.place}`}</div>
                {r.description && <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.3rem' }}>{r.description}</div>}
                {r.source && <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.3rem' }}>Source: {r.source}</div>}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

