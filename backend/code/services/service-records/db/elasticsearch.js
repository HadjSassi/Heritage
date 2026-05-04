const { Client } = require('@elastic/elasticsearch')

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
})

const INDEX = 'heritage-records'

async function ensureIndex() {
  const exists = await client.indices.exists({ index: INDEX })
  if (!exists) {
    await client.indices.create({
      index: INDEX,
      mappings: {
        properties: {
          type: { type: 'keyword' },
          title: { type: 'text', analyzer: 'standard' },
          firstName: { type: 'text' },
          lastName: { type: 'text' },
          date: { type: 'keyword' },
          place: { type: 'text' },
          country: { type: 'keyword' },
          description: { type: 'text' },
          source: { type: 'keyword' },
          imageUrl: { type: 'keyword' },
          createdAt: { type: 'date' },
        },
      },
    })
    console.log(`✅ Elasticsearch index "${INDEX}" created`)
  }
}

module.exports = { client, INDEX, ensureIndex }

