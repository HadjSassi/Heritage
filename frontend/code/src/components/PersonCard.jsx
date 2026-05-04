const styles = {
  card: {
    background: '#fff', borderRadius: '8px', padding: '1rem',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)', display: 'flex',
    gap: '0.75rem', alignItems: 'center', cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  },
  avatar: {
    width: '48px', height: '48px', borderRadius: '50%',
    objectFit: 'cover', background: '#d4e6f7', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '1.2rem', flexShrink: 0,
  },
  name: { fontWeight: 600, fontSize: '0.95rem' },
  dates: { fontSize: '0.8rem', color: '#666' },
}

export default function PersonCard({ person, onClick }) {
  const initials = `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`
  const years = [person.birthDate, person.deathDate].filter(Boolean).join(' – ')

  return (
    <div style={styles.card} onClick={() => onClick?.(person)}>
      {person.photoUrl ? (
        <img src={person.photoUrl} alt={initials} style={styles.avatar} />
      ) : (
        <div style={styles.avatar}>{initials}</div>
      )}
      <div>
        <div style={styles.name}>{person.firstName} {person.lastName}</div>
        {years && <div style={styles.dates}>{years}</div>}
      </div>
    </div>
  )
}

