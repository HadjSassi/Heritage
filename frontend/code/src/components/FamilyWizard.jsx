import { useState, useEffect, useMemo } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const EMPTY = {
  firstName: '', lastName: '', gender: 'UNKNOWN',
  birthDate: '', birthPlace: '', deathDate: '', deathPlace: '',
}
const gC = { MALE: '#1a6ab1', FEMALE: '#c0537a', UNKNOWN: '#7a7a8c' }

function getPersonData(id, persons) { return persons.find(p => p.id === id) }
function getSpouses(id, persons) {
  return getPersonData(id, persons)?.relationships
    ?.filter(r => r.type === 'SPOUSE').map(r => r.person) || []
}
function getParentsOf(childId, persons) {
  return persons.filter(p => p.relationships?.some(r => r.type === 'CHILD' && r.person.id === childId))
}
function hasFather(id, persons) { return getParentsOf(id, persons).some(p => p.gender === 'MALE') }
function hasMother(id, persons) { return getParentsOf(id, persons).some(p => p.gender === 'FEMALE') }

/* ─────────────────────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────────────────────── */
const S = {
  drawer: (v) => ({
    position: 'fixed', right: 0, top: 0, bottom: 0, width: 410, background: '#fff',
    boxShadow: '-4px 0 28px rgba(0,0,0,0.18)', zIndex: 2000,
    display: 'flex', flexDirection: 'column',
    transform: v ? 'translateX(0)' : 'translateX(110%)',
    transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
    fontFamily: "'Segoe UI',Arial,sans-serif",
  }),
  header: {
    background: 'linear-gradient(135deg,#1a3a5c,#2471a3)', color: '#fff',
    padding: '0.9rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
  },
  body: { flex: 1, overflowY: 'auto', padding: '1.1rem' },
  footer: { padding: '0.8rem 1.2rem', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  card: (active, done) => ({
    border: `2px solid ${done ? '#c8e6c9' : active ? '#2471a3' : '#e8ecf0'}`,
    borderRadius: 10, padding: '0.9rem', marginBottom: '0.9rem',
    background: done ? '#f9fff9' : active ? '#f0f7ff' : '#fafbfc',
    opacity: done ? 0.75 : 1,
  }),
  personCard: {
    background: '#f0f4f8', borderRadius: 10, padding: '0.75rem 1rem',
    marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
  },
  avatar: (color) => ({
    width: 40, height: 40, borderRadius: '50%', background: color,
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
  }),
  r2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginBottom: '0.45rem' },
  r1: { marginBottom: '0.45rem' },
  lbl: { fontSize: '0.72rem', color: '#666', fontWeight: 600, display: 'block', marginBottom: '0.15rem' },
  inp: { width: '100%', padding: '0.42rem 0.55rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.83rem', boxSizing: 'border-box', outline: 'none' },
  sel: { width: '100%', padding: '0.42rem 0.55rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.83rem', background: '#fff', boxSizing: 'border-box' },
  btnRow: { display: 'flex', gap: '0.45rem', justifyContent: 'flex-end', marginTop: '0.6rem', flexWrap: 'wrap' },
  btn: (c) => ({ padding: '0.38rem 0.85rem', background: c, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }),
  ghost: { padding: '0.38rem 0.85rem', background: '#fff', color: '#666', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem' },
  qbox: { background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '0.75rem', marginBottom: '0.6rem', fontSize: '0.83rem', color: '#5d4037', lineHeight: 1.5 },
  tag: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#e8f5e9', color: '#2e7d32', borderRadius: 6, padding: '0.18rem 0.5rem', fontSize: '0.77rem', fontWeight: 600, margin: '0.15rem 0.2rem 0.35rem 0' },
  progressOuter: { height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  progressInner: (p) => ({ width: `${p}%`, height: '100%', background: 'linear-gradient(90deg,#f39c12,#e74c3c)', transition: 'width 0.4s' }),
}

/* ─────────────────────────────────────────────────────────────────────────────
   PERSON FORM — tous les champs
───────────────────────────────────────────────────────────────────────────── */
function PersonForm({ initial = {}, genderFixed, onAdd, onSkip, loading, addLabel = '+ Ajouter', skipLabel = 'Passer' }) {
  const [f, setF] = useState({ ...EMPTY, ...initial })
  const s = (k, v) => setF(x => ({ ...x, [k]: v }))
  const submit = (e) => {
    e.preventDefault()
    onAdd({ ...f })
    setF({ ...EMPTY, ...initial })
  }
  return (
    <form onSubmit={submit}>
      <div style={S.r2}>
        <div><span style={S.lbl}>Prénom *</span><input style={S.inp} required placeholder="Prénom" value={f.firstName} onChange={e => s('firstName', e.target.value)} /></div>
        <div><span style={S.lbl}>Nom de famille</span><input style={S.inp} placeholder="Nom" value={f.lastName} onChange={e => s('lastName', e.target.value)} /></div>
      </div>
      <div style={S.r2}>
        <div>
          <span style={S.lbl}>Genre</span>
          <select style={S.sel} value={f.gender} disabled={!!genderFixed} onChange={e => s('gender', e.target.value)}>
            <option value="MALE">👨 Homme</option>
            <option value="FEMALE">👩 Femme</option>
            <option value="UNKNOWN">⚧ N/A</option>
          </select>
        </div>
        <div><span style={S.lbl}>Date de naissance</span><input style={S.inp} type="date" value={f.birthDate} onChange={e => s('birthDate', e.target.value)} /></div>
      </div>
      <div style={S.r2}>
        <div><span style={S.lbl}>Lieu de naissance</span><input style={S.inp} placeholder="Ville, Pays" value={f.birthPlace} onChange={e => s('birthPlace', e.target.value)} /></div>
        <div><span style={S.lbl}>Date de décès</span><input style={S.inp} type="date" value={f.deathDate} onChange={e => s('deathDate', e.target.value)} /></div>
      </div>
      <div style={S.r1}>
        <span style={S.lbl}>Lieu de décès</span>
        <input style={S.inp} placeholder="Ville, Pays" value={f.deathPlace} onChange={e => s('deathPlace', e.target.value)} />
      </div>
      <div style={S.btnRow}>
        <button type="button" style={S.ghost} onClick={onSkip}>{skipLabel}</button>
        <button type="submit" style={S.btn('#27ae60')} disabled={loading}>{loading ? '...' : addLabel}</button>
      </div>
    </form>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   STEP : CONJOINT(E)S
   — propose d'abord de lier l'autre parent du childId si non encore conjoint
   — puis permet d'ajouter d'autres conjoints
───────────────────────────────────────────────────────────────────────────── */
function StepSpouses({ current, persons, onAddSpouse, onLinkSpouse, onDone, loading }) {
  // Candidat = autre parent vivant dans l'arbre du childId, pas encore conjoint
  const candidate = useMemo(() => {
    if (!current.childId) return null
    const spouseIds = new Set(getSpouses(current.personId, persons).map(s => s.id))
    return getParentsOf(current.childId, persons)
      .find(p => p.id !== current.personId && !spouseIds.has(p.id)) || null
  }, [current.personId, current.childId, persons])

  const existingSpouses = getSpouses(current.personId, persons)
  const [phase, setPhase] = useState(() => candidate ? 'ask-link' : 'ask-new')
  const [added, setAdded] = useState([])

  const afterAdd = (label) => {
    setAdded(a => [...a, label])
    setPhase('ask-another')
  }

  return (
    <div>
      {existingSpouses.map(s => <div key={s.id} style={S.tag}>💍 {s.firstName} {s.lastName || ''}</div>)}
      {added.map((n, i) => <div key={i} style={S.tag}>✔ {n}</div>)}

      {phase === 'ask-link' && candidate && (
        <>
          <div style={S.qbox}>
            Est-ce que <strong>{candidate.firstName} {candidate.lastName || ''}</strong> est
            le/la conjoint(e) de <strong>{current.firstName}</strong> ?
          </div>
          <div style={S.btnRow}>
            <button style={S.ghost} onClick={() => setPhase('ask-new')}>Non</button>
            <button style={S.ghost} onClick={onDone}>Passer</button>
            <button style={S.btn('#2471a3')} disabled={loading}
              onClick={() => { onLinkSpouse(candidate.id); afterAdd(`${candidate.firstName} ${candidate.lastName || ''}`) }}>
              {loading ? '...' : 'Oui — lier 💍'}
            </button>
          </div>
        </>
      )}

      {phase === 'ask-new' && (
        <>
          <div style={S.qbox}>
            <strong>{current.firstName}</strong> a-t-il/elle un(e) conjoint(e) à ajouter ?
          </div>
          <div style={S.btnRow}>
            <button style={S.ghost} onClick={onDone}>Non / Passer</button>
            <button style={S.btn('#2471a3')} onClick={() => setPhase('form-new')}>Oui, ajouter 💍</button>
          </div>
        </>
      )}

      {phase === 'form-new' && (
        <PersonForm
          onAdd={(form) => { onAddSpouse(form); afterAdd(`${form.firstName} ${form.lastName || ''}`) }}
          onSkip={() => setPhase('ask-new')}
          loading={loading}
        />
      )}

      {phase === 'ask-another' && (
        <>
          <div style={S.qbox}>
            <strong>{current.firstName}</strong> a-t-il/elle d'autres conjoint(e)s ?
          </div>
          <div style={S.btnRow}>
            <button style={S.ghost} onClick={onDone}>Non, continuer →</button>
            <button style={S.btn('#2471a3')} onClick={() => setPhase('form-new')}>+ Autre conjoint</button>
          </div>
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   STEP : ENFANTS — itère sur chaque conjoint pour identifier la mère/père
───────────────────────────────────────────────────────────────────────────── */
function StepChildren({ current, persons, onAddChild, onDone, loading }) {
  const spouses = getSpouses(current.personId, persons)
  // Couples : un par conjoint + un "sans conjoint"
  const couples = [...spouses.map(s => ({ id: s.id, label: `${s.firstName} ${s.lastName || ''}` })), { id: null, label: null }]

  const [coupleIdx, setCoupleIdx] = useState(0)
  const [phase, setPhase] = useState('ask') // ask | form
  const [addedMap, setAddedMap] = useState({}) // coupleIdx → string[]

  const couple = couples[coupleIdx]
  const addedHere = addedMap[coupleIdx] || []
  const isLastCouple = coupleIdx === couples.length - 1

  const handleAdd = (form) => {
    onAddChild(form, couple.id)
    setAddedMap(m => ({ ...m, [coupleIdx]: [...(m[coupleIdx] || []), `${form.firstName} ${form.lastName || ''}`] }))
    setPhase('ask')
  }

  const nextCouple = () => {
    if (!isLastCouple) { setCoupleIdx(i => i + 1); setPhase('ask') }
    else onDone()
  }

  return (
    <div>
      <div style={S.qbox}>
        Enfants de <strong>{current.firstName}</strong>
        {couple.id
          ? <> et <strong>{couple.label}</strong></>
          : <em> (sans conjoint connu)</em>
        } :
      </div>
      {addedHere.map((n, i) => <div key={i} style={S.tag}>👶 {n}</div>)}

      {phase === 'ask' ? (
        <div style={S.btnRow}>
          <button style={S.ghost} onClick={nextCouple}>
            {addedHere.length === 0
              ? (isLastCouple ? 'Aucun enfant' : 'Aucun — conjoint suivant →')
              : (isLastCouple ? 'Terminé ✓' : 'Conjoint suivant →')
            }
          </button>
          <button style={S.btn('#2471a3')} onClick={() => setPhase('form')}>+ Enfant</button>
        </div>
      ) : (
        <PersonForm
          initial={{ lastName: current.lastName || '' }}
          onAdd={handleAdd}
          onSkip={() => setPhase('ask')}
          loading={loading}
          skipLabel="Annuler"
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   WIZARD PRINCIPAL
───────────────────────────────────────────────────────────────────────────── */
export default function FamilyWizard({
  visible, queue, persons, onPersonDone, onAddToQueue, onClose,
  treeId, addPersonMut, addRelationshipMut, refetchTree,
}) {
  const [saving, setSaving] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)

  const current = queue[0] || null
  const profile = current?.profile || 'full'

  // Construction dynamique des étapes selon ce qui manque réellement
  const steps = useMemo(() => {
    if (!current) return []
    const pid = current.personId
    const s = []
    if (profile === 'full' || profile === 'parent') {
      if (!hasFather(pid, persons)) s.push('father')
      if (!hasMother(pid, persons)) s.push('mother')
    }
    s.push('spouses')
    s.push('children')
    return s
  }, [current?.personId, profile, persons])

  // Reset stepIdx quand on change de personne
  useEffect(() => { setStepIdx(0) }, [current?.personId])
  // Garde stepIdx dans les bornes si steps rétrécit
  useEffect(() => {
    if (steps.length > 0 && stepIdx >= steps.length) setStepIdx(steps.length - 1)
  }, [steps.length])

  const goNext = () => {
    if (stepIdx < steps.length - 1) setStepIdx(i => i + 1)
    else onPersonDone()
  }

  /* ── Mutations helpers ── */
  const createPerson = async (form) => {
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null]))
    const { data } = await addPersonMut({ variables: { treeId, input: clean } })
    return { id: data.addPerson.id, ...clean }
  }

  const handleAddParent = async (form, gender) => {
    setSaving(true)
    try {
      const p = await createPerson({ ...form, gender })
      await addRelationshipMut({ variables: { personId: p.id, relatedPersonId: current.personId, type: 'CHILD' } })
      // Transmet le childId pour que ce parent puisse se lier à l'autre parent plus tard
      onAddToQueue({ personId: p.id, firstName: p.firstName, lastName: p.lastName || '', profile: 'parent', childId: current.personId })
      await refetchTree()
      // NE PAS appeler goNext() ici :
      // après refetch, steps se recalcule (le step 'father'/'mother' disparaît car relation existe),
      // donc stepIdx reste à 0 et pointe naturellement sur le step suivant.
    } finally { setSaving(false) }
  }

  const handleAddSpouse = async (form) => {
    setSaving(true)
    try {
      const p = await createPerson(form)
      await addRelationshipMut({ variables: { personId: current.personId, relatedPersonId: p.id, type: 'SPOUSE' } })
      await addRelationshipMut({ variables: { personId: p.id, relatedPersonId: current.personId, type: 'SPOUSE' } })
      onAddToQueue({ personId: p.id, firstName: p.firstName, lastName: p.lastName || '', profile: 'child', childId: null })
      await refetchTree()
    } finally { setSaving(false) }
  }

  const handleLinkSpouse = async (existingId) => {
    setSaving(true)
    try {
      const already = getPersonData(current.personId, persons)
        ?.relationships?.some(r => r.type === 'SPOUSE' && r.person.id === existingId)
      if (!already) {
        await addRelationshipMut({ variables: { personId: current.personId, relatedPersonId: existingId, type: 'SPOUSE' } })
        await addRelationshipMut({ variables: { personId: existingId, relatedPersonId: current.personId, type: 'SPOUSE' } })
        await refetchTree()
      }
    } finally { setSaving(false) }
  }

  const handleAddChild = async (form, spouseId) => {
    setSaving(true)
    try {
      const p = await createPerson(form)
      await addRelationshipMut({ variables: { personId: current.personId, relatedPersonId: p.id, type: 'CHILD' } })
      if (spouseId) {
        await addRelationshipMut({ variables: { personId: spouseId, relatedPersonId: p.id, type: 'CHILD' } })
      }
      onAddToQueue({ personId: p.id, firstName: p.firstName, lastName: p.lastName || '', profile: 'child', childId: null })
      await refetchTree()
    } finally { setSaving(false) }
  }

  /* ── Rendu d'une étape ── */
  const STEP_LABELS = {
    father:   { icon: '👴', label: 'Père' },
    mother:   { icon: '👵', label: 'Mère' },
    spouses:  { icon: '💍', label: 'Conjoint(e)s' },
    children: { icon: '👶', label: 'Enfants' },
  }

  const renderStep = (sk, isActive, isDone) => {
    const m = STEP_LABELS[sk]
    return (
      <div key={sk} style={S.card(isActive, isDone)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: isActive ? '0.75rem' : 0 }}>
          <span style={{ fontSize: '1.15rem' }}>{m.icon}</span>
          <span style={{ fontWeight: 700, color: '#1a3a5c', fontSize: '0.88rem' }}>{m.label}</span>
          {isDone && <span style={{ marginLeft: 'auto', color: '#27ae60', fontSize: '0.75rem' }}>✔ fait</span>}
        </div>

        {isActive && sk === 'father' && (
          <PersonForm
            initial={{ gender: 'MALE', lastName: current.lastName || '' }}
            genderFixed
            onAdd={(f) => handleAddParent(f, 'MALE')}
            onSkip={goNext} loading={saving}
          />
        )}
        {isActive && sk === 'mother' && (
          <PersonForm
            initial={{ gender: 'FEMALE' }}
            genderFixed
            onAdd={(f) => handleAddParent(f, 'FEMALE')}
            onSkip={goNext} loading={saving}
          />
        )}
        {isActive && sk === 'spouses' && (
          <StepSpouses
            key={`sp-${current.personId}`}
            current={current} persons={persons}
            onAddSpouse={handleAddSpouse}
            onLinkSpouse={handleLinkSpouse}
            onDone={goNext} loading={saving}
          />
        )}
        {isActive && sk === 'children' && (
          <StepChildren
            key={`ch-${current.personId}`}
            current={current} persons={persons}
            onAddChild={handleAddChild}
            onDone={goNext} loading={saving}
          />
        )}
      </div>
    )
  }

  const pct = current && steps.length ? Math.round((stepIdx / steps.length) * 100) : 100

  return (
    <div style={S.drawer(visible)}>
      {/* En-tête */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>🧙 Assistant arbre</span>
          <button
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '1rem' }}
            onClick={onClose}>✕</button>
        </div>
        {queue.length > 0 && (
          <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.75)' }}>
            {queue.length} personne{queue.length > 1 ? 's' : ''} en attente
          </span>
        )}
        <div style={S.progressOuter}><div style={S.progressInner(pct)} /></div>
      </div>

      {/* Corps */}
      <div style={S.body}>
        {!current ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: '1rem', color: '#aaa', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem' }}>✅</span>
            <div style={{ fontWeight: 700, color: '#1a3a5c', fontSize: '1rem' }}>Tout est à jour !</div>
            <div style={{ fontSize: '0.83rem' }}>Survolez un nœud et cliquez 🧙 pour relancer l'assistant.</div>
          </div>
        ) : (
          <>
            {/* Carte personne courante */}
            <div style={S.personCard}>
              <div style={S.avatar(gC[getPersonData(current.personId, persons)?.gender] || gC.UNKNOWN)}>
                {(current.firstName?.[0] || '?').toUpperCase()}{(current.lastName?.[0] || '').toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#1a3a5c', fontSize: '0.9rem' }}>
                  {current.firstName} {current.lastName}
                </div>
                <div style={{ fontSize: '0.71rem', color: '#888' }}>
                  Étape {Math.min(stepIdx + 1, steps.length)}/{steps.length} — {STEP_LABELS[steps[stepIdx]]?.label}
                </div>
              </div>
            </div>

            {/* Étapes (visibles = courante + passées) */}
            {steps.map((sk, i) => {
              if (i > stepIdx) return null
              return renderStep(sk, i === stepIdx, i < stepIdx)
            })}
          </>
        )}
      </div>

      {/* Pied de page */}
      {current && (
        <div style={S.footer}>
          <span style={{ fontSize: '0.76rem', color: '#aaa' }}>
            {queue.length > 1 ? `+ ${queue.length - 1} en attente` : ''}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {stepIdx < steps.length - 1
              ? <button style={S.btn('#95a5a6')} onClick={goNext}>Passer →</button>
              : <button style={S.btn('#27ae60')} onClick={onPersonDone}>
                  {queue.length > 1 ? 'Personne suivante →' : 'Terminer ✓'}
                </button>
            }
          </div>
        </div>
      )}
    </div>
  )
}
