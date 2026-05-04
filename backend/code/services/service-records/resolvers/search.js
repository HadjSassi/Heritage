const { client, INDEX } = require('../db/elasticsearch')

function mapHit(hit) {
  return { id: hit._id, ...hit._source }
}

const resolvers = {
  Query: {
    searchRecords: async (_, { query, filters = {}, page = 1, limit = 20 }) => {
      const must = [
        {
          multi_match: {
            query,
            fields: ['firstName^2', 'lastName^2', 'title', 'place', 'description'],
            fuzziness: 'AUTO',
          },
        },
      ]

      if (filters.type) must.push({ term: { type: filters.type } })
      if (filters.country) must.push({ term: { country: filters.country } })
      if (filters.fromYear || filters.toYear) {
        must.push({
          range: {
            date: {
              gte: filters.fromYear ? `${filters.fromYear}` : undefined,
              lte: filters.toYear ? `${filters.toYear}` : undefined,
            },
          },
        })
      }

      const result = await client.search({
        index: INDEX,
        from: (page - 1) * limit,
        size: limit,
        query: { bool: { must } },
      })

      return {
        total: typeof result.hits.total === 'object' ? result.hits.total.value : result.hits.total,
        results: result.hits.hits.map(mapHit),
      }
    },
    record: async (_, { id }) => {
      try {
        const result = await client.get({ index: INDEX, id })
        return mapHit(result)
      } catch {
        return null
      }
    },
  },
  Mutation: {
    createRecord: async (_, { input }) => {
      const doc = { ...input, createdAt: new Date().toISOString() }
      const result = await client.index({ index: INDEX, document: doc, refresh: true })
      return { id: result._id, ...doc }
    },
    deleteRecord: async (_, { id }) => {
      await client.delete({ index: INDEX, id, refresh: true })
      return true
    },
  },
  HistoricalRecord: {
    __resolveReference: async (ref) => {
      try {
        const result = await client.get({ index: INDEX, id: ref.id })
        return mapHit(result)
      } catch { return null }
    },
  },
}

module.exports = resolvers

