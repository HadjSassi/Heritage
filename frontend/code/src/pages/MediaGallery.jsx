import { useQuery, useMutation } from '@apollo/client'
import { GET_MEDIA } from '../graphql/queries'
import { UPLOAD_MEDIA } from '../graphql/mutations'
import FileUpload from '../components/FileUpload'

const styles = {
  page: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  h1: { color: '#1a3a5c', marginBottom: '0.5rem' },
  sub: { color: '#666', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' },
  card: { background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  thumb: { width: '100%', height: '150px', objectFit: 'cover', background: '#e0e8f5' },
  info: { padding: '0.7rem' },
  title: { fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' },
  meta: { fontSize: '0.8rem', color: '#888' },
  typeIcon: { '📷': '📷', 'PHOTO': '📷', 'DOCUMENT': '📄', 'AUDIO': '🎵' },
}

const TYPE_ICON = { PHOTO: '📷', DOCUMENT: '📄', AUDIO: '🎵' }

export default function MediaGallery() {
  const { data, loading, refetch } = useQuery(GET_MEDIA)
  const [uploadMedia] = useMutation(UPLOAD_MEDIA)

  const handleFileSelect = async (file) => {
    const type = file.type.startsWith('image') ? 'PHOTO' : file.type.startsWith('audio') ? 'AUDIO' : 'DOCUMENT'
    await uploadMedia({ variables: { input: { file: null, title: file.name, type } } })
    refetch()
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>📸 Galerie de médias</h1>
      <p style={styles.sub}>Préservez photos, documents et enregistrements audio pour les générations futures.</p>

      <FileUpload onFileSelect={handleFileSelect} accept="image/*,audio/*,.pdf,.doc,.docx" label="Ajouter une photo, un document ou un audio" />

      {loading && <div>Chargement…</div>}

      <div style={styles.grid}>
        {data?.media.map((m) => (
          <div key={m.id} style={styles.card}>
            {m.thumbnailUrl || m.type === 'PHOTO' ? (
              <img src={m.thumbnailUrl || m.url} alt={m.title} style={styles.thumb} />
            ) : (
              <div style={{ ...styles.thumb, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                {TYPE_ICON[m.type] || '📄'}
              </div>
            )}
            <div style={styles.info}>
              <div style={styles.title}>{m.title}</div>
              {m.date && <div style={styles.meta}>{m.date}</div>}
              {m.person && <div style={styles.meta}>{m.person.firstName} {m.person.lastName}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

