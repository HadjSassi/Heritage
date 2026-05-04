const { createClient } = require('redis')

let redisClient

async function getRedis() {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
    redisClient.on('error', (err) => console.error('Redis error:', err))
    await redisClient.connect()
  }
  return redisClient
}

module.exports = { getRedis }

