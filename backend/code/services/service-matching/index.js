const { ApolloServer } = require('@apollo/server')
const { buildSubgraphSchema } = require('@apollo/subgraph')
const { expressMiddleware } = require('@apollo/server/express4')
const express = require('express')
const cors = require('cors')
const { readFileSync } = require('fs')
const { parse } = require('graphql')
const resolvers = require('./resolvers/smartMatch')

const PORT = process.env.PORT || 4005
const typeDefs = parse(readFileSync('./schema.graphql', 'utf8'))

async function start() {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.get('/health', (_, res) => res.json({ status: 'ok', service: 'matching' }))

  const server = new ApolloServer({ schema: buildSubgraphSchema({ typeDefs, resolvers }) })
  await server.start()

  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => ({ userId: req.headers['x-user-id'] || null }),
  }))

  app.listen(PORT, () => console.log(`🔗 Matching service ready at http://0.0.0.0:${PORT}/graphql`))
}

start().catch((err) => { console.error(err); process.exit(1) })

