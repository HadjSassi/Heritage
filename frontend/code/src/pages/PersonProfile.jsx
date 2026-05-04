import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { GET_PERSON } from '../graphql/queries'
import { UPDATE_PERSON, ADD_LIFE_EVENT } from '../graphql/mutations'
import { useState } from 'react'

const styles = {
  page: { padding: '2rem', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', gap: '2rem', alignItems: 'flex-start', marginBottom: '2rem' },
  avatar: { width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', background: '#d4e6f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', flexShrink: 0 },
  name: { fontSize: '2rem', fontWeight: 700, color: '#1a3a5c' },
  section: { background: '#fff', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' },
  sectionTitle: { fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', color: '#1a3a5c', borderBottom: '2px solid #e0e8f0', paddingBottom: '0.5rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { marginBottom: '0.5rem' },
  label: { fontSize: '0.8rem', color: '#999', fontWeight: 600, textTransform: 'uppercase' },
  value: { fontSize: '1rem', color: '#333' },
  event: { display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' },
  eventDate: { minWidth: '100px', color: '#1a3a5c', fontWeight: 600 },
  rel: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  relBadge: { background: '#e8f0fe', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer' },
  btn: { padding: '0.5rem 1rem', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600, marginTop: '1rem' },
}

export default function PersonProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editMode, setEditMode] = useState(false)
  const { data, loading } = useQuery(GET_PERSON, { variables: { id } })
  const [updatePerson] = useMutation(UPDATE_PERSON)
  const [addLifeEvent] = useMutation(ADD_LIFE_EVENT)
  const [form, setForm] = useState(null)

  if (loading) return <div style={{ padding: '2rem' }}>Chargement…</div>

  const person = data?.person
  if (!person) return <div style={{ padding: '2rem' }}>Personne introuvable.</div>

  const startEdit = () => {
    setForm({ firstName: person.firstName, lastName: person.lastName, birthDate: person.birthDate || '', birthPlace: person.birthPlace || '', deathDate: person.deathDate || '', biography: person.biography || '' })
    setEditMode(true)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    await updatePerson({ variables: { id, input: form } })
    setEditMode(false)
  }

  const initials = `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        {person.photoUrl ? <img src={person.photoUrl} alt={initials} style={styles.avatar} /> : <div style={styles.avatar}>{initials}</div>}
        <div>
          <div style={styles.name}>{person.firstName} {person.lastName}</div>
          <div style={{ color: '#666', marginTop: '0.3rem' }}>{person.birthDate} — {person.deathDate || 'présent'}</div>
          <button style={styles.btn} onClick={editMode ? () => setEditMode(false) : startEdit}>{editMode ? 'Annuler' : '✏️ Modifier'}</button>
        </div>
      </div>

      {editMode && form && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Modifier les informations</div>
          <form onSubmit={saveEdit}>
            <div style={styles.grid}>
              {['firstName', 'lastName', 'birthDate', 'birthPlace', 'deathDate'].map((k) => (
                <div key={k} style={styles.field}>
                  <label style={styles.label}>{k}</label>
                  <input style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                </div>
              ))}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Biographie</label>
              <textarea style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', minHeight: '100px' }} value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} />
            </div>
            <button type="submit" style={styles.btn}>💾 Enregistrer</button>
          </form>
        </div>
      )}

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Informations personnelles</div>
        <div style={styles.grid}>
          {[['Prénom', person.firstName], ['Nom', person.lastName], ['Naissance', person.birthDate], ['Lieu de naissance', person.birthPlace], ['Décès', person.deathDate], ['Lieu de décès', person.deathPlace], ['Genre', person.gender]].map(([label, value]) => (
            <div key={label} style={styles.field}>
              <div style={styles.label}>{label}</div>
              <div style={styles.value}>{value || '—'}</div>
            </div>
          ))}
        </div>
        {person.biography && <div style={{ marginTop: '1rem', color: '#444', lineHeight: 1.6 }}>{person.biography}</div>}
      </div>

      {person.lifeEvents?.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Événements de vie</div>
          {person.lifeEvents.map((e) => (
            <div key={e.id} style={styles.event}>
              <span style={styles.eventDate}>{e.date}</span>
              <span><strong>{e.type}</strong>{e.place ? ` — ${e.place}` : ''}{e.description ? ` : ${e.description}` : ''}</span>
            </div>
          ))}
        </div>
      )}

      {person.relationships?.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Relations familiales</div>
          <div style={styles.rel}>
            {person.relationships.map((r, i) => (
              <span key={i} style={styles.relBadge} onClick={() => navigate(`/person/${r.person.id}`)}>
                {r.type}: {r.person.firstName} {r.person.lastName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

