import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, MarkerType } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { GET_FAMILY_TREES, GET_FAMILY_TREE } from '../graphql/queries'
import { CREATE_FAMILY_TREE, ADD_PERSON, UPDATE_PERSON, DELETE_PERSON, ADD_RELATIONSHIP, IMPORT_GEDCOM } from '../graphql/mutations'
import TreeNode from '../components/TreeNode'
import FileUpload from '../components/FileUpload'
import FamilyWizard from '../components/FamilyWizard'

const nodeTypes = { person: TreeNode }

// ── Hierarchical family-tree layout ───────────────────────────────────────────
// Règles :
//  - Les parents sont toujours AU-DESSUS de leurs enfants (Y croît vers le bas)
//  - Les conjoints sont sur la MÊME génération et placés côte à côte
//  - Les enfants sont centrés sous leurs parents
//  - Les fratries restent groupées
function computeLayout(persons) {
  if (!persons.length) return {}
  const NODE_W = 210, NODE_H = 180, H_GAP = 40, V_GAP = 80

  // ── 1. Construire les maps de relations ─────────────────────────────────
  const childrenOf = {} // parentId  → Set<childId>
  const parentsOf  = {} // childId   → Set<parentId>
  const spousesOf  = {} // personId  → personId[]

  persons.forEach(p => {
    p.relationships?.forEach(r => {
      if (r.type === 'CHILD') {
        if (!childrenOf[p.id]) childrenOf[p.id] = new Set()
        childrenOf[p.id].add(r.person.id)
        if (!parentsOf[r.person.id]) parentsOf[r.person.id] = new Set()
        parentsOf[r.person.id].add(p.id)
      }
      if (r.type === 'SPOUSE') {
        if (!spousesOf[p.id]) spousesOf[p.id] = []
        if (!spousesOf[p.id].includes(r.person.id)) spousesOf[p.id].push(r.person.id)
      }
    })
  })

  // ── 2. Assigner les générations via BFS (parents → enfants) ────────────
  const gen = {}
  const roots = persons.filter(p => !parentsOf[p.id]?.size).map(p => p.id)
  const queue = roots.map(id => [id, 0])
  const visited = new Set()
  for (let i = 0; i < queue.length; i++) {
    const [id, g] = queue[i]
    if (visited.has(id)) { gen[id] = Math.max(gen[id] || 0, g); continue }
    visited.add(id)
    gen[id] = g
    for (const cid of (childrenOf[id] || [])) queue.push([cid, g + 1])
  }
  persons.forEach(p => { if (!(p.id in gen)) gen[p.id] = 0 })

  // Synchroniser les conjoints sur la même génération (max des deux)
  let changed = true
  while (changed) {
    changed = false
    persons.forEach(p => {
      (spousesOf[p.id] || []).forEach(sid => {
        const maxG = Math.max(gen[p.id] || 0, gen[sid] || 0)
        if (gen[p.id] !== maxG) { gen[p.id] = maxG; changed = true }
        if (gen[sid] !== maxG) { gen[sid] = maxG; changed = true }
      })
    })
  }

  // ── 3. Grouper par génération ────────────────────────────────────────────
  const byGen = {}
  persons.forEach(p => {
    const g = gen[p.id] || 0
    if (!byGen[g]) byGen[g] = []
    if (!byGen[g].includes(p.id)) byGen[g].push(p.id)
  })

  // ── 4. Ré-ordonner chaque génération : conjoints adjacents ───────────────
  Object.keys(byGen).forEach(g => {
    const ids = byGen[g]
    const ordered = []
    const seen = new Set()
    ids.forEach(id => {
      if (seen.has(id)) return
      seen.add(id)
      ordered.push(id)
      // Ajouter les conjoints immédiatement à droite
      ;(spousesOf[id] || []).forEach(sid => {
        if (!seen.has(sid) && ids.includes(sid)) {
          seen.add(sid)
          ordered.push(sid)
        }
      })
    })
    byGen[g] = ordered
  })

  // ── 5. Assigner les positions X/Y ────────────────────────────────────────
  // On utilise un layout en deux passes :
  //   Passe 1 : positions X naïves par génération (centré)
  //   Passe 2 : ajuster X des enfants pour les centrer sous leurs parents

  const pos = {}

  // Passe 1 : position naïve centrée
  Object.entries(byGen).forEach(([g, ids]) => {
    const totalW = ids.length * (NODE_W + H_GAP) - H_GAP
    const startX = -totalW / 2
    ids.forEach((id, i) => {
      pos[id] = {
        x: startX + i * (NODE_W + H_GAP),
        y: parseInt(g) * (NODE_H + V_GAP),
      }
    })
  })

  // Passe 2 : centrer les enfants sous le milieu de leurs parents
  const maxGen = Math.max(...Object.keys(byGen).map(Number))
  for (let g = 1; g <= maxGen; g++) {
    const ids = byGen[g] || []
    ids.forEach(id => {
      const myParents = [...(parentsOf[id] || [])]
      if (!myParents.length) return
      // Milieu X des parents
      const parentXs = myParents.map(pid => pos[pid]?.x || 0)
      const midParentX = parentXs.reduce((a, b) => a + b, 0) / parentXs.length
      // Trouver les frères/sœurs (même parents)
      const siblings = ids.filter(sid => {
        const sp = [...(parentsOf[sid] || [])]
        return sp.some(p => myParents.includes(p))
      })
      const sibIdx = siblings.indexOf(id)
      const totalSibW = siblings.length * (NODE_W + H_GAP) - H_GAP
      pos[id] = {
        ...pos[id],
        x: midParentX - totalSibW / 2 + sibIdx * (NODE_W + H_GAP),
      }
    })
  }

  return pos
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
      onWizard: () => handlers.openWizard(p),
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

  // Wizard FIFO
  const [wizardQueue, setWizardQueue] = useState([])
  const [wizardVisible, setWizardVisible] = useState(false)
  // Second parent dialog (quand on ajoute un enfant manuellement)
  const [secondParentCtx, setSecondParentCtx] = useState(null)
  // { newPersonId, newPersonFirstName, newPersonLastName, parentName, spouseId, spouseName }

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
    openWizard: (person) => {
      setWizardQueue(q => {
        const alreadyIn = q.some(p => p.personId === person.id)
        if (alreadyIn) return q
        // Mettre cette personne en tête de file
        return [{ personId: person.id, firstName: person.firstName, lastName: person.lastName }, ...q]
      })
      setWizardVisible(true)
    },
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
    const { data } = await createTree({ variables: { input: newTreeForm } })
    await refetchTrees()
    setShowNewTree(false)
    setNewTreeForm({ name: '', description: '' })
    // Auto-sélectionner l'arbre qui vient d'être créé
    setSelectedTreeId(data.createFamilyTree.id)
  }

  const handleAddPerson = async (form) => {
    setSaving(true)
    try {
      const cleanForm = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null]))
      const { data } = await addPersonMut({ variables: { treeId: selectedTreeId, input: cleanForm } })
      const newPersonId = data.addPerson.id

      if (addPersonCtx?.relatedTo && addPersonCtx?.relationType) {
        const { relatedTo, relationType } = addPersonCtx
        if (relationType === 'CHILD') {
          await addRelationshipMut({ variables: { personId: relatedTo.id, relatedPersonId: newPersonId, type: 'CHILD' } })
        } else if (relationType === 'PARENT') {
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

      if (!addPersonCtx?.relatedTo) {
        // Première personne de l'arbre → wizard complet
        setWizardQueue([{ personId: newPersonId, firstName: cleanForm.firstName, lastName: cleanForm.lastName, profile: 'full' }])
        setWizardVisible(true)

      } else if (addPersonCtx?.relationType === 'CHILD') {
        // Enfant ajouté manuellement → chercher si le parent a un(e) conjoint(e)
        const parentData = persons.find(p => p.id === addPersonCtx.relatedTo.id)
        const spouse = parentData?.relationships?.find(r => r.type === 'SPOUSE')?.person
        if (spouse) {
          // Proposer de lier au second parent
          setSecondParentCtx({
            newPersonId,
            newPersonFirstName: cleanForm.firstName,
            newPersonLastName: cleanForm.lastName,
            parentName: `${addPersonCtx.relatedTo.firstName} ${addPersonCtx.relatedTo.lastName}`,
            spouseId: spouse.id,
            spouseName: `${spouse.firstName} ${spouse.lastName}`,
          })
        } else {
          // Pas de conjoint connu → juste ajouter à la file
          setWizardQueue(q => q.some(x => x.personId === newPersonId) ? q
            : [...q, { personId: newPersonId, firstName: cleanForm.firstName, lastName: cleanForm.lastName, profile: 'child' }])
        }

      } else if (addPersonCtx?.relationType === 'PARENT') {
        // Nouveau parent ajouté manuellement → leurs parents déjà gérés
        setWizardQueue(q => q.some(x => x.personId === newPersonId) ? q
          : [...q, { personId: newPersonId, firstName: cleanForm.firstName, lastName: cleanForm.lastName, profile: 'parent' }])
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Confirmation second parent ────────────────────────────────────────────
  const handleConfirmSecondParent = async (confirm) => {
    const ctx = secondParentCtx
    setSaving(true)
    try {
      if (confirm) {
        await addRelationshipMut({ variables: { personId: ctx.spouseId, relatedPersonId: ctx.newPersonId, type: 'CHILD' } })
        await refetchTree()
      }
    } finally {
      setSaving(false)
    }
    setSecondParentCtx(null)
    setWizardQueue(q => q.some(x => x.personId === ctx.newPersonId) ? q
      : [...q, { personId: ctx.newPersonId, firstName: ctx.newPersonFirstName, lastName: ctx.newPersonLastName, profile: 'child' }])
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
        {wizardQueue.length > 0 && (
          <button
            style={{ ...S.btn, background: wizardVisible ? '#8e44ad' : '#9b59b6', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setWizardVisible(v => !v)}
          >
            🧙 {wizardVisible ? 'Masquer' : 'Reprendre'} l'assistant
            <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 12, padding: '0 6px', fontSize: '0.78rem', fontWeight: 700 }}>
              {wizardQueue.length}
            </span>
          </button>
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

      {/* ── Dialog second parent ── */}
      {secondParentCtx && (
        <div style={S.overlay}>
          <div style={{ ...S.card, width: 430 }}>
            <div style={S.cardTitle}>👨‍👩‍👦 Second parent ?</div>
            <p style={{ color: '#444', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              <strong>{secondParentCtx.newPersonFirstName} {secondParentCtx.newPersonLastName}</strong> vient
              d'être ajouté(e) comme enfant de <strong>{secondParentCtx.parentName}</strong>.<br /><br />
              Est-ce que <strong style={{ color: '#2471a3' }}>{secondParentCtx.spouseName}</strong> est
              également le/la parent(e) de{' '}
              <strong>{secondParentCtx.newPersonFirstName}</strong> ?
            </p>
            <div style={S.actions}>
              <button style={S.btnGhost} onClick={() => handleConfirmSecondParent(false)}>Non</button>
              <button style={S.btnGreen} onClick={() => handleConfirmSecondParent(true)} disabled={saving}>
                {saving ? '...' : `Oui, lier à ${secondParentCtx.spouseName}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Wizard assistant famille ── */}
      {selectedTreeId && (
        <FamilyWizard
          visible={wizardVisible}
          queue={wizardQueue}
          persons={persons}
          onPersonDone={() => setWizardQueue(q => q.slice(1))}
          onAddToQueue={(p) => setWizardQueue(q => {
            if (q.some(x => x.personId === p.personId)) return q
            return [...q, p]
          })}
          onUpdateQueueItem={(personId, updates) => setWizardQueue(q =>
            q.map(item => item.personId === personId ? { ...item, ...updates } : item)
          )}
          onClose={() => setWizardVisible(false)}
          treeId={selectedTreeId}
          addPersonMut={addPersonMut}
          addRelationshipMut={addRelationshipMut}
          refetchTree={async () => { await refetchTree(); await refetchTrees() }}
        />
      )}
    </div>
  )
}

