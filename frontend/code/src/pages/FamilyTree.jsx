import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { GET_FAMILY_TREES, GET_FAMILY_TREE } from '../graphql/queries'
import { CREATE_FAMILY_TREE, ADD_PERSON, IMPORT_GEDCOM } from '../graphql/mutations'
import TreeNode from '../components/TreeNode'
import FileUpload from '../components/FileUpload'

const nodeTypes = { person: TreeNode }

const styles = {
  page: { padding: '1.5rem' },
  toolbar: { display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' },
  select: { padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.95rem' },
  btn: { padding: '0.5rem 1rem', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600 },
  btnGreen: { padding: '0.5rem 1rem', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600 },
  canvas: { height: '70vh', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fafafa' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modalCard: { background: '#fff', borderRadius: '12px', padding: '2rem', width: '400px' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.95rem' },
}

function toFlow(persons = []) {
  const nodes = persons.map((p, i) => ({
    id: p.id, type: 'person', position: { x: (i % 5) * 200, y: Math.floor(i / 5) * 150 },
    data: { firstName: p.firstName, lastName: p.lastName, birthDate: p.birthDate, deathDate: p.deathDate },
  }))
  const edges = []
  persons.forEach((p) => {
    p.relationships?.forEach((r) => {
      if (r.type === 'CHILD') {
        edges.push({ id: `${p.id}-${r.person.id}`, source: r.person.id, target: p.id, label: 'enfant' })
      }
    })
  })
  return { nodes, edges }
}

export default function FamilyTree() {
  const [selectedTreeId, setSelectedTreeId] = useState('')
  const [showNewTree, setShowNewTree] = useState(false)
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [newTree, setNewTree] = useState({ name: '', description: '' })
  const [newPerson, setNewPerson] = useState({ firstName: '', lastName: '', birthDate: '', gender: 'UNKNOWN' })

  const { data: treesData, refetch: refetchTrees } = useQuery(GET_FAMILY_TREES)
  const { data: treeData } = useQuery(GET_FAMILY_TREE, { variables: { id: selectedTreeId }, skip: !selectedTreeId })

  const [createTree] = useMutation(CREATE_FAMILY_TREE)
  const [addPerson] = useMutation(ADD_PERSON)
  const [importGedcom] = useMutation(IMPORT_GEDCOM)

  const { nodes: initNodes, edges: initEdges } = treeData?.familyTree
    ? toFlow(treeData.familyTree.persons)
    : { nodes: [], edges: [] }

  const [nodes, , onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const handleCreateTree = async (e) => {
    e.preventDefault()
    await createTree({ variables: { input: newTree } })
    await refetchTrees()
    setShowNewTree(false)
    setNewTree({ name: '', description: '' })
  }

  const handleAddPerson = async (e) => {
    e.preventDefault()
    await addPerson({ variables: { treeId: selectedTreeId, input: newPerson } })
    setShowAddPerson(false)
  }

  const handleGedcomImport = async (file) => {
    const text = await file.text()
    await importGedcom({ variables: { treeId: selectedTreeId, gedcomContent: text } })
  }

  return (
    <div style={styles.page}>
      <div style={styles.toolbar}>
        <select style={styles.select} value={selectedTreeId} onChange={(e) => setSelectedTreeId(e.target.value)}>
          <option value="">-- Choisir un arbre --</option>
          {treesData?.familyTrees.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.personCount} personnes)</option>
          ))}
        </select>
        <button style={styles.btn} onClick={() => setShowNewTree(true)}>+ Nouvel arbre</button>
        {selectedTreeId && <button style={styles.btnGreen} onClick={() => setShowAddPerson(true)}>+ Ajouter une personne</button>}
        {selectedTreeId && <FileUpload onFileSelect={handleGedcomImport} accept=".ged,.gedcom" label="Importer GEDCOM" />}
      </div>

      <div style={styles.canvas}>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {showNewTree && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <h3 style={{ marginBottom: '1.5rem' }}>Créer un arbre généalogique</h3>
            <form onSubmit={handleCreateTree}>
              <div style={styles.field}><label style={styles.label}>Nom *</label><input style={styles.input} required value={newTree.name} onChange={(e) => setNewTree({ ...newTree, name: e.target.value })} /></div>
              <div style={styles.field}><label style={styles.label}>Description</label><input style={styles.input} value={newTree.description} onChange={(e) => setNewTree({ ...newTree, description: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowNewTree(false)}>Annuler</button>
                <button type="submit" style={styles.btn}>Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddPerson && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <h3 style={{ marginBottom: '1.5rem' }}>Ajouter une personne</h3>
            <form onSubmit={handleAddPerson}>
              <div style={styles.field}><label style={styles.label}>Prénom *</label><input style={styles.input} required value={newPerson.firstName} onChange={(e) => setNewPerson({ ...newPerson, firstName: e.target.value })} /></div>
              <div style={styles.field}><label style={styles.label}>Nom *</label><input style={styles.input} required value={newPerson.lastName} onChange={(e) => setNewPerson({ ...newPerson, lastName: e.target.value })} /></div>
              <div style={styles.field}><label style={styles.label}>Date de naissance</label><input style={styles.input} type="date" value={newPerson.birthDate} onChange={(e) => setNewPerson({ ...newPerson, birthDate: e.target.value })} /></div>
              <div style={styles.field}>
                <label style={styles.label}>Genre</label>
                <select style={styles.input} value={newPerson.gender} onChange={(e) => setNewPerson({ ...newPerson, gender: e.target.value })}>
                  <option value="MALE">Homme</option>
                  <option value="FEMALE">Femme</option>
                  <option value="UNKNOWN">Non spécifié</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddPerson(false)}>Annuler</button>
                <button type="submit" style={styles.btnGreen}>Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

