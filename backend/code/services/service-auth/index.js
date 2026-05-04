const { ApolloServer } = require('@apollo/server')
const { buildSubgraphSchema } = require('@apollo/subgraph')
const { expressMiddleware } = require('@apollo/server/express4')
const express = require('express')
const cors = require('cors')
const { readFileSync } = require('fs')
const { parse } = require('graphql')
const pool = require('./db/postgres')
const resolvers = require('./resolvers/auth')

const PORT = process.env.PORT || 4001
const typeDefs = parse(readFileSync('./schema.graphql', 'utf8'))

async function runMigrations() {
  const { readFileSync } = require('fs')
  const sql = readFileSync('./db/migrations/001_users.sql', 'utf8')
  await pool.query(sql)
  console.log('✅ Migrations applied (service-auth)')
}

async function start() {
  try {
    await runMigrations()
  } catch (err) {
    console.warn('Migration warning:', err.message)
  }

  const app = express()
  app.use(cors())
  app.use(express.json())

  app.get('/health', (_, res) => res.json({ status: 'ok', service: 'auth' }))

  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
  })
  await server.start()

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => ({
        userId: req.headers['x-user-id'] || null,
        userEmail: req.headers['x-user-email'] || null,
      }),
    })
  )

  app.listen(PORT, () => {
    console.log(`🔐 Auth service ready at http://0.0.0.0:${PORT}/graphql`)
  })
}

start().catch((err) => { console.error(err); process.exit(1) })

