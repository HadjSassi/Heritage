import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { useNavigate, Link } from 'react-router-dom'
import { LOGIN } from '../graphql/mutations'

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' },
  card: { background: '#fff', borderRadius: '12px', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
  h2: { textAlign: 'center', marginBottom: '2rem', color: '#1a3a5c' },
  field: { marginBottom: '1.2rem' },
  label: { display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.9rem', color: '#555' },
  input: { width: '100%', padding: '0.7rem 1rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '1rem', outline: 'none' },
  btn: { width: '100%', padding: '0.8rem', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '1rem', marginTop: '0.5rem' },
  error: { color: '#c0392b', marginBottom: '1rem', fontSize: '0.9rem' },
  link: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#555' },
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [login, { loading, error }] = useMutation(LOGIN)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await login({ variables: form })
      localStorage.setItem('heritage_token', data.login.token)
      navigate('/tree')
    } catch (_) {}
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.h2}>🌳 Connexion</h2>
        {error && <div style={styles.error}>{error.message}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
            <input style={styles.input} type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
        </form>
        <div style={styles.link}>Pas encore de compte ? <Link to="/register">S'inscrire</Link></div>
      </div>
    </div>
  )
}

