import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, MarkerType } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { GET_FAMILY_TREES, GET_FAMILY_TREE } from '../graphql/queries'
import { CREATE_FAMILY_TREE, ADD_PERSON, UPDATE_PERSON, DELETE_PERSON, ADD_RELATIONSHIP, IMPORT_GEDCOM } from '../graphql/mutations'
import TreeNode from '../components/TreeNode'
import FileUpload from '../components/FileUpload'

const nodeTypes = { person: TreeNode }

// ── Hierarchical layout ────────────────────────────────────────────────────
function computeLayout(persons) {
  const NODE_W = 200, NODE_H = 200
  const childrenOf = {}, parentOf = {}, spouseOf = {}

  persons.forEach((p) => {
    p.relationships?.forEach((r) => {
      if (r.type === 'CHILD') {
        // p is the parent of r.person
        if (!childrenOf[p.id]) childrenOf[p.id] = []
        if (!childrenOf[p.id].includes(r.person.id)) childrenOf[p.id].push(r.person.id)
        parentOf[r.person.id] = p.id
      }
      if (r.type === 'SPOUSE') spouseOf[p.id] = r.person.id
    })
  })

  // BFS to assign generation levels
  const levels = {}
  const hasParent = new Set(Object.keys(parentOf))
  const roots = persons.filter((p) => !hasParent.has(p.id)).map((p) => p.id)
  const queue = roots.map((id) => ({ id, level: 0 }))
  const visited = new Set()
  while (queue.length) {
    const { id, level } = queue.shift()
    if (visited.has(id)) continue
    visited.add(id)
    levels[id] = level
    ;(childrenOf[id] || []).forEach((cid) => queue.push({ id: cid, level: level + 1 }))
  }
  persons.forEach((p) => { if (!(p.id in levels)) levels[p.id] = 0 })

  // Group by level
  const byLevel = {}
  persons.forEach((p) => {
    const l = levels[p.id]
    if (!byLevel[l]) byLevel[l] = []
    byLevel[l].push(p.id)
  })

  // Assign x/y positions
  const positions = {}
  Object.entries(byLevel).forEach(([level, ids]) => {
    const totalW = ids.length * NODE_W
    ids.forEach((id, i) => {
      positions[id] = { x: i * NODE_W - totalW / 2 + NODE_W / 2, y: parseInt(level) * NODE_H }
    })
  })
  return positions
}

function toFlow(persons, handlers) {
  const positions = computeLayout(persons)
  const nodes = persons.map((p) => ({
    id: p.id,
    type: 'person',
    position: positions[p.id] || { x: 0, y: 0 },
    data: {
      ...p,
      onAddParent: () => handlers.addRelative(p, 'PARENT'),
      onAddChild: () => handlers.addRelative(p, 'CHILD'),
      onAddSpouse: () => handlers.addRelative(p, 'SPOUSE'),
      onAddSibling: () => handlers.addRelative(p, 'SIBLING'),
      onEdit: () => handlers.edit(p),
      onDelete: () => handlers.del(p),
    },
  }))

  const edges = []
  persons.forEach((p) => {
    p.relationships?.forEach((r) => {
      const edgeId = `${p.id}-${r.type}-${r.person.id}`
      if (r.type === 'CHILD') {
        edges.push({
          id: edgeId, source: p.id, target: r.person.id,
          type: 'smoothstep', animated: false,
          style: { stroke: '#1a3a5c', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#1a3a5c' },
        })
      } else if (r.type === 'SPOUSE') {
        const alreadyExists = edges.find((e) => e.id === `${r.person.id}-SPOUSE-${p.id}`)
        if (!alreadyExists) {
          edges.push({
            id: edgeId, source: p.id, sourceHandle: 'right', target: r.person.id,
            type: 'straight', label: '💍',
            style: { stroke: '#e67e22', strokeWidth: 2, strokeDasharray: '6 3' },
          })
        }
      } else if (r.type === 'SIBLING') {
        const alreadyExists = edges.find((e) => e.id === `${r.person.id}-SIBLING-${p.id}`)
        if (!alreadyExists) {
          edges.push({
            id: edgeId, source: p.id, target: r.person.id,
            type: 'straight',
            style: { stroke: '#27ae60', strokeWidth: 1.5, strokeDasharray: '4 4' },
          })
        }
      }
    })
  })
  return { nodes, edges }
}

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f6fa' },
  header: { display: 'flex', gap: '0.75rem', padding: '0.75rem 1.25rem', background: '#1a3a5c', alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
  select: { padding: '0.5rem 0.75rem', borderRadius: 6, border: 'none', fontSize: '0.9rem', background: '#fff', minWidth: 200, cursor: 'pointer' },
  btn: { padding: '0.5rem 1rem', background: '#2980b9', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.15s' },
  btnGreen: { padding: '0.5rem 1rem', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' },
  btnRed: { padding: '0.5rem 1rem', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' },
  btnGhost: { padding: '0.5rem 1rem', background: 'transparent', color: '#555', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem' },
  canvas: { flex: 1 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 },
  card: { background: '#fff', borderRadius: 14, padding: '2rem', width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
  cardTitle: { fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1a3a5c' },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' },
  field: { marginBottom: '0.75rem' },
  label: { display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem', color: '#444' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' },
  textarea: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem', minHeight: 80, resize: 'vertical', boxSizing: 'border-box' },
  actions: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', color: '#555' },
  emptyIcon: { fontSize: '5rem' },
  emptyTitle: { fontSize: '1.5rem', fontWeight: 700, color: '#1a3a5c' },
  emptyText: { color: '#888', textAlign: 'center', maxWidth: 400 },
}

const EMPTY_PERSON = { firstName: '', lastName: '', birthDate: '', birthPlace: '', deathDate: '', deathPlace: '', gender: 'UNKNOWN', biography: '' }

// ── Person form ─────────────────────────────────────────────────────────────
function PersonForm({ title, initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial || EMPTY_PERSON)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <div style={S.cardTitle}>{title}</div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}>
          <div style={S.fieldRow}>
            <div><label style={S.label}>Prénom *</label><input style={S.input} required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Prénom" /></div>
            <div><label style={S.label}>Nom *</label><input style={S.input} required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Nom" /></div>
          </div>
          <div style={S.field}>
            <label style={S.label}>Genre</label>
            <select style={S.input} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="MALE">👨 Homme</option>
              <option value="FEMALE">👩 Femme</option>
              <option value="UNKNOWN">⚧ Non spécifié</option>
            </select>
          </div>
          <div style={S.fieldRow}>
            <div><label style={S.label}>Date de naissance</label><input style={S.input} type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></div>
            <div><label style={S.label}>Lieu de naissance</label><input style={S.input} value={form.birthPlace} onChange={(e) => set('birthPlace', e.target.value)} placeholder="Ville, Pays" /></div>
          </div>
          <div style={S.fieldRow}>
            <div><label style={S.label}>Date de décès</label><input style={S.input} type="date" value={form.deathDate} onChange={(e) => set('deathDate', e.target.value)} /></div>
            <div><label style={S.label}>Lieu de décès</label><input style={S.input} value={form.deathPlace} onChange={(e) => set('deathPlace', e.target.value)} placeholder="Ville, Pays" /></div>
          </div>
          <div style={S.field}>
            <label style={S.label}>Biographie</label>
            <textarea style={S.textarea} value={form.biography} onChange={(e) => set('biography', e.target.value)} placeholder="Quelques mots sur cette personne..." />
          </div>
          <div style={S.actions}>
            <button type="button" style={S.btnGhost} onClick={onCancel}>Annuler</button>
            <button type="submit" style={S.btnGreen} disabled={loading}>{loading ? '...' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Relation label ──────────────────────────────────────────────────────────
const RELATION_LABELS = {
  PARENT: (name) => `Ajouter un parent de ${name}`,
  CHILD: (name) => `Ajouter un enfant de ${name}`,
  SPOUSE: (name) => `Ajouter le/la conjoint(e) de ${name}`,
  SIBLING: (name) => `Ajouter un frère ou sœur de ${name}`,
}

// ── Main component ──────────────────────────────────────────────────────────
export default function FamilyTree() {
  const [selectedTreeId, setSelectedTreeId] = useState('')
  const [showNewTree, setShowNewTree] = useState(false)
  const [newTreeForm, setNewTreeForm] = useState({ name: '', description: '' })

  // Modals
  const [addPersonCtx, setAddPersonCtx] = useState(null)   // { relatedTo: Person|null, relationType: string|null }
  const [editPersonCtx, setEditPersonCtx] = useState(null) // Person
  const [deletePersonCtx, setDeletePersonCtx] = useState(null) // Person
  const [saving, setSaving] = useState(false)

  // Queries
  const { data: treesData, refetch: refetchTrees } = useQuery(GET_FAMILY_TREES)
  const { data: treeData, refetch: refetchTree } = useQuery(GET_FAMILY_TREE, {
    variables: { id: selectedTreeId },
    skip: !selectedTreeId,
    fetchPolicy: 'network-only',
  })

  // Mutations
  const [createTree] = useMutation(CREATE_FAMILY_TREE)
  const [addPersonMut] = useMutation(ADD_PERSON)
  const [updatePersonMut] = useMutation(UPDATE_PERSON)
  const [deletePersonMut] = useMutation(DELETE_PERSON)
  const [addRelationshipMut] = useMutation(ADD_RELATIONSHIP)
  const [importGedcom] = useMutation(IMPORT_GEDCOM)

  // Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const persons = treeData?.familyTree?.persons || []

  const handlers = useMemo(() => ({
    addRelative: (person, relationType) => setAddPersonCtx({ relatedTo: person, relationType }),
    edit: (person) => setEditPersonCtx(person),
    del: (person) => setDeletePersonCtx(person),
  }), [])

  useEffect(() => {
    const { nodes: n, edges: e } = persons.length ? toFlow(persons, handlers) : { nodes: [], edges: [] }
    setNodes(n)
    setEdges(e)
  }, [treeData, handlers])

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCreateTree = async (e) => {
    e.preventDefault()
    await createTree({ variables: { input: newTreeForm } })
    await refetchTrees()
    setShowNewTree(false)
    setNewTreeForm({ name: '', description: '' })
  }

  const handleAddPerson = async (form) => {
    setSaving(true)
    try {
      const cleanForm = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null]))
      const { data } = await addPersonMut({ variables: { treeId: selectedTreeId, input: cleanForm } })
      const newPersonId = data.addPerson.id

      if (addPersonCtx?.relatedTo && addPersonCtx?.relationType) {
        const { relatedTo, relationType } = addPersonCtx
        // Create the relationship from the reference person to the new person
        if (relationType === 'CHILD') {
          // relatedTo is the parent → addRelationship(relatedTo.id, newPersonId, CHILD)
          await addRelationshipMut({ variables: { personId: relatedTo.id, relatedPersonId: newPersonId, type: 'CHILD' } })
        } else if (relationType === 'PARENT') {
          // newPerson is the parent of relatedTo → addRelationship(newPersonId, relatedTo.id, CHILD)
          await addRelationshipMut({ variables: { personId: newPersonId, relatedPersonId: relatedTo.id, type: 'CHILD' } })
        } else if (relationType === 'SPOUSE') {
          await addRelationshipMut({ variables: { personId: relatedTo.id, relatedPersonId: newPersonId, type: 'SPOUSE' } })
          await addRelationshipMut({ variables: { personId: newPersonId, relatedPersonId: relatedTo.id, type: 'SPOUSE' } })
        } else if (relationType === 'SIBLING') {
          await addRelationshipMut({ variables: { personId: relatedTo.id, relatedPersonId: newPersonId, type: 'SIBLING' } })
          await addRelationshipMut({ variables: { personId: newPersonId, relatedPersonId: relatedTo.id, type: 'SIBLING' } })
        }
      }

      await refetchTree()
      await refetchTrees()
      setAddPersonCtx(null)
    } finally {
      setSaving(false)
    }
  }

  const handleEditPerson = async (form) => {
    setSaving(true)
    try {
      const cleanForm = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null]))
      await updatePersonMut({ variables: { id: editPersonCtx.id, input: cleanForm } })
      await refetchTree()
      setEditPersonCtx(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePerson = async () => {
    setSaving(true)
    try {
      await deletePersonMut({ variables: { id: deletePersonCtx.id } })
      await refetchTree()
      await refetchTrees()
      setDeletePersonCtx(null)
    } finally {
      setSaving(false)
    }
  }

  const handleGedcomImport = async (file) => {
    const text = await file.text()
    await importGedcom({ variables: { treeId: selectedTreeId, gedcomContent: text } })
    await refetchTree()
    await refetchTrees()
  }

  // ── Add person form title ────────────────────────────────────────────────
  const addFormTitle = addPersonCtx
    ? addPersonCtx.relatedTo
      ? RELATION_LABELS[addPersonCtx.relationType]?.(`${addPersonCtx.relatedTo.firstName} ${addPersonCtx.relatedTo.lastName}`) || 'Ajouter une personne'
      : 'Ajouter la première personne'
    : ''

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Header bar */}
      <div style={S.header}>
        <select style={S.select} value={selectedTreeId} onChange={(e) => setSelectedTreeId(e.target.value)}>
          <option value="">🌳 Choisir un arbre...</option>
          {treesData?.familyTrees.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.personCount} pers.)</option>
          ))}
        </select>
        <button style={S.btn} onClick={() => setShowNewTree(true)}>+ Nouvel arbre</button>
        {selectedTreeId && persons.length === 0 && (
          <button style={S.btnGreen} onClick={() => setAddPersonCtx({ relatedTo: null, relationType: null })}>
            + Première personne
          </button>
        )}
        {selectedTreeId && (
          <FileUpload onFileSelect={handleGedcomImport} accept=".ged,.gedcom" label="📂 Import GEDCOM" />
        )}
        <span style={{ color: '#aac', fontSize: '0.8rem', marginLeft: 'auto' }}>
          Survolez un nœud pour ajouter des membres ou modifier
        </span>
      </div>

      {/* Tree canvas or empty state */}
      {!selectedTreeId ? (
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>🌳</div>
          <div style={S.emptyTitle}>Votre arbre généalogique</div>
          <div style={S.emptyText}>Sélectionnez un arbre existant ou créez-en un nouveau pour commencer.</div>
          <button style={{ ...S.btn, fontSize: '1rem', padding: '0.75rem 2rem' }} onClick={() => setShowNewTree(true)}>
            Créer mon premier arbre
          </button>
        </div>
      ) : persons.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>👤</div>
          <div style={S.emptyTitle}>Arbre vide</div>
          <div style={S.emptyText}>Commencez par ajouter la première personne de votre famille.</div>
          <button style={{ ...S.btnGreen, fontSize: '1rem', padding: '0.75rem 2rem' }}
            onClick={() => setAddPersonCtx({ relatedTo: null, relationType: null })}>
            + Ajouter la première personne
          </button>
        </div>
      ) : (
        <div style={S.canvas}>
          <ReactFlow
            nodes={nodes} edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2} maxZoom={2}
          >
            <Background color="#dde" gap={20} />
            <Controls />
            <MiniMap nodeColor={(n) => {
              const g = n.data?.gender
              return g === 'MALE' ? '#1a6ab1' : g === 'FEMALE' ? '#c0537a' : '#7a7a8c'
            }} />
          </ReactFlow>
        </div>
      )}

      {/* ── Modals ── */}

      {/* New tree */}
      {showNewTree && (
        <div style={S.overlay}>
          <div style={S.card}>
            <div style={S.cardTitle}>🌳 Créer un nouvel arbre généalogique</div>
            <form onSubmit={handleCreateTree}>
              <div style={S.field}><label style={S.label}>Nom de l'arbre *</label><input style={S.input} required value={newTreeForm.name} onChange={(e) => setNewTreeForm({ ...newTreeForm, name: e.target.value })} placeholder="Ex: Famille Dupont" /></div>
              <div style={S.field}><label style={S.label}>Description</label><input style={S.input} value={newTreeForm.description} onChange={(e) => setNewTreeForm({ ...newTreeForm, description: e.target.value })} placeholder="Description optionnelle" /></div>
              <div style={S.actions}>
                <button type="button" style={S.btnGhost} onClick={() => setShowNewTree(false)}>Annuler</button>
                <button type="submit" style={S.btnGreen}>Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add person */}
      {addPersonCtx && (
        <PersonForm
          title={addFormTitle}
          initial={EMPTY_PERSON}
          onSubmit={handleAddPerson}
          onCancel={() => setAddPersonCtx(null)}
          loading={saving}
        />
      )}

      {/* Edit person */}
      {editPersonCtx && (
        <PersonForm
          title={`✏️ Modifier — ${editPersonCtx.firstName} ${editPersonCtx.lastName}`}
          initial={{
            firstName: editPersonCtx.firstName || '',
            lastName: editPersonCtx.lastName || '',
            birthDate: editPersonCtx.birthDate || '',
            birthPlace: editPersonCtx.birthPlace || '',
            deathDate: editPersonCtx.deathDate || '',
            deathPlace: editPersonCtx.deathPlace || '',
            gender: editPersonCtx.gender || 'UNKNOWN',
            biography: editPersonCtx.biography || '',
          }}
          onSubmit={handleEditPerson}
          onCancel={() => setEditPersonCtx(null)}
          loading={saving}
        />
      )}

      {/* Delete confirm */}
      {deletePersonCtx && (
        <div style={S.overlay}>
          <div style={{ ...S.card, width: 380 }}>
            <div style={S.cardTitle}>🗑️ Supprimer cette personne ?</div>
            <p style={{ color: '#555', marginBottom: '1rem' }}>
              Voulez-vous vraiment supprimer <strong>{deletePersonCtx.firstName} {deletePersonCtx.lastName}</strong> ?<br />
              Cette action est irréversible et supprimera toutes ses relations.
            </p>
            <div style={S.actions}>
              <button style={S.btnGhost} onClick={() => setDeletePersonCtx(null)}>Annuler</button>
              <button style={S.btnRed} onClick={handleDeletePerson} disabled={saving}>
                {saving ? '...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

