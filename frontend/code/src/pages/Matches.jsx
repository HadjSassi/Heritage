import { useQuery, useMutation } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { GET_MATCHES } from '../graphql/queries'
import { ACCEPT_MATCH, REJECT_MATCH } from '../graphql/mutations'

const styles = {
  page: { padding: '2rem', maxWidth: '900px', margin: '0 auto' },
  h1: { color: '#1a3a5c', marginBottom: '0.5rem' },
  sub: { color: '#666', marginBottom: '2rem' },
  card: { background: '#fff', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', display: 'flex', gap: '1.5rem', alignItems: 'center' },
  confidence: { minWidth: '60px', height: '60px', borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1a3a5c', fontSize: '1.1rem', flexShrink: 0 },
  content: { flex: 1 },
  title: { fontWeight: 700, marginBottom: '0.3rem' },
  meta: { fontSize: '0.85rem', color: '#666' },
  badge: { display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' },
  actions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },
  btnAccept: { padding: '0.4rem 1rem', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600 },
  btnReject: { padding: '0.4rem 1rem', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600 },
  empty: { textAlign: 'center', color: '#999', padding: '4rem', fontSize: '1.1rem' },
}

const TYPE_LABEL = { TREE: 'Correspondance d\'arbre', RECORD: 'Correspondance d\'archive' }
const STATUS_COLOR = { PENDING: '#f39c12', ACCEPTED: '#27ae60', REJECTED: '#e74c3c' }

export default function Matches() {
  const navigate = useNavigate()
  const { data, loading, refetch } = useQuery(GET_MATCHES)
  const [acceptMatch] = useMutation(ACCEPT_MATCH)
  const [rejectMatch] = useMutation(REJECT_MATCH)

  const handleAccept = async (id) => { await acceptMatch({ variables: { id } }); refetch() }
  const handleReject = async (id) => { await rejectMatch({ variables: { id } }); refetch() }

  if (loading) return <div style={{ padding: '2rem' }}>Chargement…</div>

  const matches = data?.matches || []

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>🔗 Smart Matching</h1>
      <p style={styles.sub}>Correspondances automatiques trouvées pour les personnes de votre arbre.</p>

      {matches.length === 0 && <div style={styles.empty}>🎉 Aucune correspondance en attente pour l'instant.</div>}

      {matches.map((m) => (
        <div key={m.id} style={styles.card}>
          <div style={styles.confidence} title="Score de confiance">{Math.round(m.confidence * 100)}%</div>
          <div style={styles.content}>
            <span style={{ ...styles.badge, background: '#e8f0fe', color: '#1a3a5c' }}>{TYPE_LABEL[m.type] || m.type}</span>
            <span style={{ ...styles.badge, background: STATUS_COLOR[m.status] + '22', color: STATUS_COLOR[m.status], marginLeft: '0.5rem' }}>{m.status}</span>
            <div style={styles.title} onClick={() => navigate(`/person/${m.person.id}`)} role="button" style={{ ...styles.title, cursor: 'pointer', color: '#1a3a5c' }}>
              {m.person.firstName} {m.person.lastName} {m.person.birthDate && `(${m.person.birthDate})`}
            </div>
            {m.matchedPerson && (
              <div style={styles.meta}>↔ {m.matchedPerson.firstName} {m.matchedPerson.lastName} {m.matchedPerson.birthDate && `(${m.matchedPerson.birthDate})`}</div>
            )}
            {m.matchedRecord && (
              <div style={styles.meta}>📄 {m.matchedRecord.title} — {m.matchedRecord.type} {m.matchedRecord.date && `(${m.matchedRecord.date})`} {m.matchedRecord.place}</div>
            )}
          </div>
          {m.status === 'PENDING' && (
            <div style={styles.actions}>
              <button style={styles.btnAccept} onClick={() => handleAccept(m.id)}>✓ Accepter</button>
              <button style={styles.btnReject} onClick={() => handleReject(m.id)}>✗ Rejeter</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

