import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { useNavigate, Link } from 'react-router-dom'
import { REGISTER } from '../graphql/mutations'

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' },
  card: { background: '#fff', borderRadius: '12px', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
  h2: { textAlign: 'center', marginBottom: '2rem', color: '#1a3a5c' },
  field: { marginBottom: '1.2rem' },
  label: { display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.9rem', color: '#555' },
  input: { width: '100%', padding: '0.7rem 1rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '1rem', outline: 'none' },
  btn: { width: '100%', padding: '0.8rem', background: '#e8a020', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '1rem', marginTop: '0.5rem' },
  error: { color: '#c0392b', marginBottom: '1rem', fontSize: '0.9rem' },
  link: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#555' },
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [register, { loading, error }] = useMutation(REGISTER)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await register({ variables: { input: form } })
      localStorage.setItem('heritage_token', data.register.token)
      navigate('/tree')
    } catch (_) {}
  }

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.h2}>🌳 Créer un compte</h2>
        {error && <div style={styles.error}>{error.message}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}><label style={styles.label}>Prénom</label><input style={styles.input} required {...f('firstName')} /></div>
          <div style={styles.field}><label style={styles.label}>Nom</label><input style={styles.input} required {...f('lastName')} /></div>
          <div style={styles.field}><label style={styles.label}>Email</label><input style={styles.input} type="email" required {...f('email')} /></div>
          <div style={styles.field}><label style={styles.label}>Mot de passe</label><input style={styles.input} type="password" required minLength={8} {...f('password')} /></div>
          <button style={styles.btn} type="submit" disabled={loading}>{loading ? 'Création…' : 'Créer mon compte'}</button>
        </form>
        <div style={styles.link}>Déjà un compte ? <Link to="/login">Se connecter</Link></div>
      </div>
    </div>
  )
}

