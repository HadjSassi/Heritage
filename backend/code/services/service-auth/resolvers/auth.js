const pool = require('../db/postgres')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { createClient } = require('redis')

const JWT_SECRET = process.env.JWT_SECRET || 'heritage_jwt_secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

let redisClient
async function getRedis() {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
    redisClient.on('error', (err) => console.error('Redis error:', err))
    await redisClient.connect()
  }
  return redisClient
}

function mapUser(row) {
  return { id: row.id, email: row.email, firstName: row.first_name, lastName: row.last_name, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() }
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

const resolvers = {
  Query: {
    me: async (_, __, context) => {
      if (!context.userId) throw new Error('Non authentifié')
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [context.userId])
      if (!rows[0]) throw new Error('Utilisateur introuvable')
      return mapUser(rows[0])
    },
  },
  Mutation: {
    register: async (_, { input }) => {
      const { firstName, lastName, email, password } = input
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
      if (existing.rows.length > 0) throw new Error('Cet email est déjà utilisé')
      const hashed = await bcrypt.hash(password, 12)
      const { rows } = await pool.query(
        'INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, hashed, firstName, lastName]
      )
      const user = mapUser(rows[0])
      const token = signToken(user)
      return { token, user }
    },
    login: async (_, { email, password }) => {
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
      if (!rows[0]) throw new Error('Email ou mot de passe incorrect')
      const valid = await bcrypt.compare(password, rows[0].password)
      if (!valid) throw new Error('Email ou mot de passe incorrect')
      const user = mapUser(rows[0])
      const token = signToken(user)
      const redis = await getRedis()
      await redis.set(`session:${user.id}`, token, { EX: 7 * 24 * 3600 })
      return { token, user }
    },
    logout: async (_, __, context) => {
      if (context.userId) {
        const redis = await getRedis()
        await redis.del(`session:${context.userId}`)
      }
      return true
    },
  },
  User: {
    __resolveReference: async (ref) => {
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [ref.id])
      return rows[0] ? mapUser(rows[0]) : null
    },
  },
}

module.exports = resolvers

