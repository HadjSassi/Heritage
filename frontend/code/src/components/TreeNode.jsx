import { Handle, Position } from '@xyflow/react'
import { useState } from 'react'

const genderColor = { MALE: '#1a6ab1', FEMALE: '#c0537a', UNKNOWN: '#7a7a8c' }
const genderBg = { MALE: '#e8f0fb', FEMALE: '#fce8f0', UNKNOWN: '#f3f3f6' }

function Initials({ firstName, lastName, gender }) {
  const bg = genderColor[gender] || genderColor.UNKNOWN
  const initials = `${(firstName || '?')[0]}${(lastName || '?')[0]}`.toUpperCase()
  return (
    <div style={{
      width: 52, height: 52, borderRadius: '50%', background: bg,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: '1.1rem', margin: '0 auto 0.5rem', flexShrink: 0,
      border: `3px solid ${bg}`, boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    }}>
      {initials}
    </div>
  )
}

export default function TreeNode({ data }) {
  const [hover, setHover] = useState(false)
  const color = genderColor[data.gender] || genderColor.UNKNOWN
  const bg = genderBg[data.gender] || genderBg.UNKNOWN

  const btn = (emoji, onClick, title) => (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick && onClick() }}
      style={{
        background: '#fff', border: `1px solid ${color}`, color: color,
        borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
        fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = '#fff' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = color }}
    >
      {emoji}
    </button>
  )

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: bg, border: `2px solid ${color}`, borderRadius: 12,
        padding: '0.75rem 0.75rem 0.5rem', minWidth: 150, maxWidth: 170,
        textAlign: 'center', boxShadow: hover ? `0 4px 18px ${color}44` : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.2s', cursor: 'pointer', position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color, width: 10, height: 10 }} />

      {data.photoUrl
        ? <img src={data.photoUrl} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.5rem', display: 'block', border: `3px solid ${color}` }} />
        : <Initials firstName={data.firstName} lastName={data.lastName} gender={data.gender} />
      }

      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a2e', lineHeight: 1.3 }}>
        {data.firstName}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a2e', lineHeight: 1.3, marginBottom: '0.3rem' }}>
        {(data.lastName || '').toUpperCase()}
      </div>
      {(data.birthDate || data.deathDate) && (
        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.4rem' }}>
          {data.birthDate ? `° ${data.birthDate}` : '?'}{data.deathDate ? ` † ${data.deathDate}` : ''}
        </div>
      )}

      {hover && (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {btn('👴', data.onAddParent, 'Ajouter un parent')}
          {btn('👶', data.onAddChild, 'Ajouter un enfant')}
          {btn('💍', data.onAddSpouse, 'Ajouter conjoint(e)')}
          {btn('👫', data.onAddSibling, 'Ajouter frère/sœur')}
          {btn('✏️', data.onEdit, 'Modifier')}
          {btn('🗑️', data.onDelete, 'Supprimer')}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: color, width: 10, height: 10 }} />
      <Handle type="source" id="left" position={Position.Left} style={{ background: '#e67e22', width: 8, height: 8 }} />
      <Handle type="source" id="right" position={Position.Right} style={{ background: '#e67e22', width: 8, height: 8 }} />
    </div>
  )
}
