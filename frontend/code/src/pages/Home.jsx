import { Link } from 'react-router-dom'

const styles = {
  hero: {
    background: 'linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 100%)',
    color: '#fff', padding: '6rem 2rem', textAlign: 'center',
  },
  h1: { fontSize: '3rem', marginBottom: '1rem' },
  subtitle: { fontSize: '1.2rem', opacity: 0.9, marginBottom: '2rem' },
  btnGroup: { display: 'flex', gap: '1rem', justifyContent: 'center' },
  btnPrimary: {
    background: '#e8a020', color: '#fff', padding: '0.8rem 2rem',
    borderRadius: '4px', fontWeight: 700, fontSize: '1rem',
    textDecoration: 'none', display: 'inline-block',
  },
  btnSecondary: {
    background: 'transparent', color: '#fff', padding: '0.8rem 2rem',
    borderRadius: '4px', fontWeight: 700, fontSize: '1rem',
    textDecoration: 'none', border: '2px solid #fff', display: 'inline-block',
  },
  features: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem', padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto',
  },
  feature: {
    background: '#fff', borderRadius: '8px', padding: '2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center',
  },
  icon: { fontSize: '2.5rem', marginBottom: '1rem' },
  featureTitle: { fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' },
  featureText: { color: '#666', fontSize: '0.95rem' },
}

const features = [
  { icon: '🌳', title: 'Arbre généalogique', desc: 'Construisez et gérez votre arbre familial avec import/export GEDCOM.' },
  { icon: '📚', title: 'Archives historiques', desc: 'Accédez à des millions de documents d\'archives du monde entier.' },
  { icon: '🔍', title: 'Smart Matching', desc: 'Découvrez automatiquement des ancêtres grâce à l\'IA.' },
  { icon: '📸', title: 'Galerie médias', desc: 'Préservez photos, documents et histoires pour les générations futures.' },
  { icon: '🌍', title: 'Recherche globale', desc: 'Cherchez vos ancêtres dans de nombreuses langues et pays.' },
  { icon: '🔐', title: 'Sécurisé & privé', desc: 'Vos données familiales sont protégées et sécurisées.' },
]

export default function Home() {
  return (
    <div>
      <section style={styles.hero}>
        <h1 style={styles.h1}>Découvrez votre histoire</h1>
        <p style={styles.subtitle}>Construisez votre arbre généalogique, explorez vos origines et préservez votre héritage familial.</p>
        <div style={styles.btnGroup}>
          <Link to="/register" style={styles.btnPrimary}>Commencer gratuitement</Link>
          <Link to="/login" style={styles.btnSecondary}>Se connecter</Link>
        </div>
      </section>
      <section>
        <div style={styles.features}>
          {features.map((f) => (
            <div key={f.title} style={styles.feature}>
              <div style={styles.icon}>{f.icon}</div>
              <div style={styles.featureTitle}>{f.title}</div>
              <div style={styles.featureText}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

