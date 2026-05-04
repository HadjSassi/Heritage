const pool = require('../db/postgres')
const { driver } = require('../db/neo4j')

function mapPerson(row) {
  return {
    id: row.id, treeId: row.tree_id,
    firstName: row.first_name, lastName: row.last_name,
    birthDate: row.birth_date ? row.birth_date.toISOString().split('T')[0] : null,
    birthPlace: row.birth_place,
    deathDate: row.death_date ? row.death_date.toISOString().split('T')[0] : null,
    deathPlace: row.death_place,
    gender: row.gender || 'UNKNOWN',
    photoUrl: row.photo_url,
    biography: row.biography,
  }
}

function mapTree(row, personCount = 0) {
  return {
    id: row.id, name: row.name, description: row.description,
    ownerId: row.owner_id, personCount,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

const resolvers = {
  Query: {
    familyTrees: async (_, __, context) => {
      const ownerId = context.userId || '00000000-0000-0000-0000-000000000000'
      const { rows } = await pool.query('SELECT * FROM family_trees WHERE owner_id = $1 ORDER BY created_at DESC', [ownerId])
      return Promise.all(rows.map(async (r) => {
        const { rows: cnt } = await pool.query('SELECT COUNT(*) FROM persons WHERE tree_id = $1', [r.id])
        return mapTree(r, parseInt(cnt[0].count))
      }))
    },
    familyTree: async (_, { id }) => {
      const { rows } = await pool.query('SELECT * FROM family_trees WHERE id = $1', [id])
      if (!rows[0]) return null
      const { rows: cnt } = await pool.query('SELECT COUNT(*) FROM persons WHERE tree_id = $1', [id])
      return mapTree(rows[0], parseInt(cnt[0].count))
    },
    person: async (_, { id }) => {
      const { rows } = await pool.query('SELECT * FROM persons WHERE id = $1', [id])
      return rows[0] ? mapPerson(rows[0]) : null
    },
  },
  Mutation: {
    createFamilyTree: async (_, { input }, context) => {
      const ownerId = context.userId || '00000000-0000-0000-0000-000000000000'
      const { rows } = await pool.query(
        'INSERT INTO family_trees (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
        [input.name, input.description || null, ownerId]
      )
      return mapTree(rows[0], 0)
    },
    deleteFamilyTree: async (_, { id }) => {
      await pool.query('DELETE FROM family_trees WHERE id = $1', [id])
      return true
    },
    addPerson: async (_, { treeId, input }) => {
      const { rows } = await pool.query(
        `INSERT INTO persons (tree_id, first_name, last_name, birth_date, birth_place, death_date, death_place, gender, photo_url, biography)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [treeId, input.firstName, input.lastName, input.birthDate || null, input.birthPlace || null,
         input.deathDate || null, input.deathPlace || null, input.gender || 'UNKNOWN', input.photoUrl || null, input.biography || null]
      )
      const person = mapPerson(rows[0])
      // Create Neo4j node
      const session = driver.session()
      try {
        await session.run(
          'MERGE (p:Person {id: $id}) SET p.firstName = $firstName, p.lastName = $lastName, p.treeId = $treeId',
          { id: person.id, firstName: person.firstName, lastName: person.lastName, treeId }
        )
      } finally { await session.close() }
      return person
    },
    updatePerson: async (_, { id, input }) => {
      const fields = [], values = []
      const mapping = { firstName: 'first_name', lastName: 'last_name', birthDate: 'birth_date', birthPlace: 'birth_place', deathDate: 'death_date', deathPlace: 'death_place', gender: 'gender', photoUrl: 'photo_url', biography: 'biography' }
      Object.entries(input).forEach(([k, v]) => {
        if (v !== undefined && mapping[k]) {
          fields.push(`${mapping[k]} = $${fields.length + 1}`)
          values.push(v || null)
        }
      })
      if (!fields.length) throw new Error('Aucun champ à mettre à jour')
      values.push(id)
      const { rows } = await pool.query(
        `UPDATE persons SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values
      )
      return mapPerson(rows[0])
    },
    deletePerson: async (_, { id }) => {
      await pool.query('DELETE FROM persons WHERE id = $1', [id])
      const session = driver.session()
      try { await session.run('MATCH (p:Person {id: $id}) DETACH DELETE p', { id }) }
      finally { await session.close() }
      return true
    },
    addRelationship: async (_, { personId, relatedPersonId, type }) => {
      const session = driver.session()
      try {
        await session.run(
          `MATCH (a:Person {id: $personId}), (b:Person {id: $relatedPersonId})
           MERGE (a)-[:${type}]->(b)`,
          { personId, relatedPersonId }
        )
      } finally { await session.close() }
      const { rows } = await pool.query('SELECT * FROM persons WHERE id = $1', [relatedPersonId])
      return { type, person: mapPerson(rows[0]) }
    },
    addLifeEvent: async (_, { personId, input }) => {
      const { rows } = await pool.query(
        'INSERT INTO life_events (person_id, type, date, place, description) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [personId, input.type, input.date || null, input.place || null, input.description || null]
      )
      return { id: rows[0].id, type: rows[0].type, date: rows[0].date?.toISOString().split('T')[0] || null, place: rows[0].place, description: rows[0].description }
    },
    importGedcom: async (_, { treeId, gedcomContent }) => {
      // Parse basic GEDCOM — extract individuals
      const lines = gedcomContent.split('\n')
      let current = null
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts[0] === '0' && parts[2] === 'INDI') {
          current = { firstName: '', lastName: '', birthDate: null, gender: 'UNKNOWN' }
        } else if (current && parts[0] === '1') {
          if (parts[1] === 'SEX') current.gender = parts[2] === 'M' ? 'MALE' : parts[2] === 'F' ? 'FEMALE' : 'UNKNOWN'
          if (parts[1] === 'GIVN') current.firstName = parts.slice(2).join(' ')
          if (parts[1] === 'SURN') current.lastName = parts.slice(2).join(' ')
        } else if (current && parts[0] === '2' && parts[1] === 'DATE') {
          current.birthDate = parts.slice(2).join(' ')
        } else if (current && parts[0] === '0' && current.firstName) {
          await pool.query(
            'INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
            [treeId, current.firstName || 'Inconnu', current.lastName || '', current.birthDate || null, current.gender]
          )
          current = null
        }
      }
      const { rows } = await pool.query('SELECT * FROM family_trees WHERE id = $1', [treeId])
      const { rows: cnt } = await pool.query('SELECT COUNT(*) FROM persons WHERE tree_id = $1', [treeId])
      return mapTree(rows[0], parseInt(cnt[0].count))
    },
    exportGedcom: async (_, { treeId }) => {
      const { rows: persons } = await pool.query('SELECT * FROM persons WHERE tree_id = $1', [treeId])
      let gedcom = '0 HEAD\n1 GEDC\n2 VERS 5.5.1\n1 CHAR UTF-8\n'
      persons.forEach((p, i) => {
        gedcom += `0 @I${i + 1}@ INDI\n`
        gedcom += `1 NAME ${p.first_name} /${p.last_name}/\n`
        gedcom += `2 GIVN ${p.first_name}\n2 SURN ${p.last_name}\n`
        if (p.gender) gedcom += `1 SEX ${p.gender === 'MALE' ? 'M' : p.gender === 'FEMALE' ? 'F' : 'U'}\n`
        if (p.birth_date) gedcom += `1 BIRT\n2 DATE ${p.birth_date.toISOString().split('T')[0]}\n`
      })
      gedcom += '0 TRLR\n'
      return gedcom
    },
  },
  FamilyTree: {
    __resolveReference: async (ref) => {
      const { rows } = await pool.query('SELECT * FROM family_trees WHERE id = $1', [ref.id])
      if (!rows[0]) return null
      const { rows: cnt } = await pool.query('SELECT COUNT(*) FROM persons WHERE tree_id = $1', [ref.id])
      return mapTree(rows[0], parseInt(cnt[0].count))
    },
    persons: async (tree) => {
      const { rows } = await pool.query('SELECT * FROM persons WHERE tree_id = $1', [tree.id])
      return rows.map(mapPerson)
    },
  },
  Person: {
    __resolveReference: async (ref) => {
      const { rows } = await pool.query('SELECT * FROM persons WHERE id = $1', [ref.id])
      return rows[0] ? mapPerson(rows[0]) : null
    },
    lifeEvents: async (person) => {
      const { rows } = await pool.query('SELECT * FROM life_events WHERE person_id = $1 ORDER BY date', [person.id])
      return rows.map((r) => ({ id: r.id, type: r.type, date: r.date?.toISOString().split('T')[0] || null, place: r.place, description: r.description }))
    },
    relationships: async (person) => {
      const session = driver.session()
      try {
        const result = await session.run(
          'MATCH (p:Person {id: $id})-[r]->(related:Person) RETURN type(r) as type, related.id as relatedId',
          { id: person.id }
        )
        const relations = result.records.map((rec) => ({ type: rec.get('type'), relatedId: rec.get('relatedId') }))
        return Promise.all(relations.map(async ({ type, relatedId }) => {
          const { rows } = await pool.query('SELECT * FROM persons WHERE id = $1', [relatedId])
          return rows[0] ? { type, person: mapPerson(rows[0]) } : null
        })).then((r) => r.filter(Boolean))
      } finally { await session.close() }
    },
  },
}

module.exports = resolvers

