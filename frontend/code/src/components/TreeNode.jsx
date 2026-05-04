import { Handle, Position } from '@xyflow/react'

const styles = {
  node: {
    background: '#fff', border: '2px solid #1a3a5c', borderRadius: '8px',
    padding: '0.5rem 0.75rem', minWidth: '120px', textAlign: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
  name: { fontWeight: 600, fontSize: '0.85rem' },
  dates: { fontSize: '0.7rem', color: '#777' },
}

export default function TreeNode({ data }) {
  return (
    <div style={styles.node}>
      <Handle type="target" position={Position.Top} />
      <div style={styles.name}>{data.firstName} {data.lastName}</div>
      {(data.birthDate || data.deathDate) && (
        <div style={styles.dates}>
          {data.birthDate || '?'} – {data.deathDate || ''}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

