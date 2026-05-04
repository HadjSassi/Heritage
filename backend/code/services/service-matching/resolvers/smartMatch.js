const { getRedis } = require('../db/redis')
const { v4: uuidv4 } = require('uuid')

const MATCHES_KEY = 'heritage:matches'

async function getAllMatches() {
  const redis = await getRedis()
  const data = await redis.get(MATCHES_KEY)
  return data ? JSON.parse(data) : []
}

async function saveMatches(matches) {
  const redis = await getRedis()
  await redis.set(MATCHES_KEY, JSON.stringify(matches))
}

/**
 * Compute a simple similarity score between two persons based on name + birth year.
 * Returns a float in [0, 1].
 */
function computeConfidence(a, b) {
  let score = 0
  const maxScore = 3

  if (a.firstName && b.firstName) {
    const sim = a.firstName.toLowerCase() === b.firstName.toLowerCase() ? 1
      : a.firstName.toLowerCase().startsWith(b.firstName.toLowerCase().slice(0, 3)) ? 0.5 : 0
    score += sim
  }
  if (a.lastName && b.lastName) {
    score += a.lastName.toLowerCase() === b.lastName.toLowerCase() ? 1 : 0
  }
  if (a.birthDate && b.birthDate) {
    const yearA = parseInt(a.birthDate.slice(0, 4))
    const yearB = parseInt(b.birthDate.slice(0, 4))
    score += Math.abs(yearA - yearB) <= 2 ? 1 : 0
  }

  return score / maxScore
}

const resolvers = {
  Query: {
    matches: async (_, __, context) => {
      const matches = await getAllMatches()
      // Filter by user context if needed
      return matches
    },
    match: async (_, { id }) => {
      const matches = await getAllMatches()
      return matches.find((m) => m.id === id) || null
    },
  },
  Mutation: {
    acceptMatch: async (_, { id }) => {
      const matches = await getAllMatches()
      const idx = matches.findIndex((m) => m.id === id)
      if (idx === -1) throw new Error('Match introuvable')
      matches[idx].status = 'ACCEPTED'
      await saveMatches(matches)
      return matches[idx]
    },
    rejectMatch: async (_, { id }) => {
      const matches = await getAllMatches()
      const idx = matches.findIndex((m) => m.id === id)
      if (idx === -1) throw new Error('Match introuvable')
      matches[idx].status = 'REJECTED'
      await saveMatches(matches)
      return matches[idx]
    },
    triggerMatching: async (_, { personId }) => {
      // Simulate matching — in production this would call service-tree and service-records
      const newMatches = [
        {
          id: uuidv4(),
          type: 'RECORD',
          confidence: 0.85,
          status: 'PENDING',
          personId,
          person: { id: personId, firstName: 'Inconnu', lastName: '', birthDate: null },
          matchedRecordId: uuidv4(),
          matchedRecord: { id: uuidv4(), title: 'Acte de naissance simulé', type: 'BIRTH', date: '1880', place: 'Paris, France' },
          createdAt: new Date().toISOString(),
        },
      ]
      const existing = await getAllMatches()
      await saveMatches([...existing, ...newMatches])
      return newMatches
    },
  },
  Match: {
    __resolveReference: async (ref) => {
      const matches = await getAllMatches()
      return matches.find((m) => m.id === ref.id) || null
    },
  },
}

module.exports = resolvers

