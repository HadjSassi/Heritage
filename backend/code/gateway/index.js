const { ApolloServer } = require('@apollo/server')
const { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } = require('@apollo/gateway')
const { expressMiddleware } = require('@apollo/server/express4')
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')

const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'heritage_jwt_secret'

/**
 * Auth-aware DataSource: forwards the user context to subgraphs
 */
class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
    if (context.user) {
      request.http.headers.set('x-user-id', context.user.id)
      request.http.headers.set('x-user-email', context.user.email)
    }
  }
}

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'auth', url: process.env.AUTH_SERVICE_URL || 'http://service-auth:4001/graphql' },
      { name: 'tree', url: process.env.TREE_SERVICE_URL || 'http://service-tree:4002/graphql' },
      { name: 'records', url: process.env.RECORDS_SERVICE_URL || 'http://service-records:4003/graphql' },
      { name: 'media', url: process.env.MEDIA_SERVICE_URL || 'http://service-media:4004/graphql' },
      { name: 'matching', url: process.env.MATCHING_SERVICE_URL || 'http://service-matching:4005/graphql' },
    ],
  }),
  buildService({ url }) {
    return new AuthenticatedDataSource({ url })
  },
})

async function start() {
  const app = express()
  app.use(cors())
  app.use(express.json())

  // Health check
  app.get('/health', (_, res) => res.json({ status: 'ok', service: 'gateway' }))

  const server = new ApolloServer({ gateway })
  await server.start()

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || ''
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

        let user = null
        if (token) {
          try {
            user = jwt.verify(token, JWT_SECRET)
          } catch {
            // Token invalide — continue sans user
          }
        }
        return { user }
      },
    })
  )

  app.listen(PORT, () => {
    console.log(`🚀 Gateway ready at http://0.0.0.0:${PORT}/graphql`)
  })
}

start().catch((err) => {
  console.error('Gateway failed to start:', err)
  process.exit(1)
})

