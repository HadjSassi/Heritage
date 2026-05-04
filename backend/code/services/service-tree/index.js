const { ApolloServer } = require('@apollo/server')
const { buildSubgraphSchema } = require('@apollo/subgraph')
const { expressMiddleware } = require('@apollo/server/express4')
const express = require('express')
const cors = require('cors')
const { readFileSync } = require('fs')
const { parse } = require('graphql')
const pool = require('./db/postgres')
const { verifyConnectivity } = require('./db/neo4j')
const resolvers = require('./resolvers/tree')

const PORT = process.env.PORT || 4002
const typeDefs = parse(readFileSync('./schema.graphql', 'utf8'))

async function runMigrations() {
  const sql = readFileSync('./db/migrations/001_tree.sql', 'utf8')
  await pool.query(sql)
  console.log('✅ Migrations applied (service-tree)')
}

async function start() {
  try { await runMigrations() } catch (err) { console.warn('Migration warning:', err.message) }
  try { await verifyConnectivity() } catch (err) { console.warn('Neo4j not ready yet:', err.message) }

  const app = express()
  app.use(cors())
  app.use(express.json())
  app.get('/health', (_, res) => res.json({ status: 'ok', service: 'tree' }))

  const server = new ApolloServer({ schema: buildSubgraphSchema({ typeDefs, resolvers }) })
  await server.start()

  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => ({ userId: req.headers['x-user-id'] || null }),
  }))

  app.listen(PORT, () => console.log(`🌳 Tree service ready at http://0.0.0.0:${PORT}/graphql`))
}

start().catch((err) => { console.error(err); process.exit(1) })

