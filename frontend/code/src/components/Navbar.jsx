import { Link, useNavigate } from 'react-router-dom'
import { useApolloClient } from '@apollo/client'

const styles = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, height: '64px',
    background: '#1a3a5c', color: '#fff', display: 'flex',
    alignItems: 'center', padding: '0 2rem', gap: '2rem', zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  brand: { fontWeight: 700, fontSize: '1.4rem', color: '#fff' },
  link: { color: '#cce0f5', fontSize: '0.95rem' },
  right: { marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' },
  btn: {
    background: '#e8a020', color: '#fff', border: 'none',
    padding: '0.4rem 1rem', borderRadius: '4px', fontWeight: 600,
  },
}

export default function Navbar() {
  const navigate = useNavigate()
  const client = useApolloClient()
  const token = localStorage.getItem('heritage_token')

  const handleLogout = () => {
    localStorage.removeItem('heritage_token')
    client.clearStore()
    navigate('/')
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>🌳 Heritage</Link>
      {token && (
        <>
          <Link to="/tree" style={styles.link}>Arbre familial</Link>
          <Link to="/search" style={styles.link}>Recherche</Link>
          <Link to="/media" style={styles.link}>Médias</Link>
          <Link to="/matches" style={styles.link}>Correspondances</Link>
        </>
      )}
      <div style={styles.right}>
        {token ? (
          <button style={styles.btn} onClick={handleLogout}>Déconnexion</button>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Connexion</Link>
            <button style={styles.btn} onClick={() => navigate('/register')}>S'inscrire</button>
          </>
        )}
      </div>
    </nav>
  )
}

