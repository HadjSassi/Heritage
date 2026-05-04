const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'heritage',
  user: process.env.POSTGRES_USER || 'heritage',
  password: process.env.POSTGRES_PASSWORD || 'heritage_pass',
})

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err)
})

module.exports = pool

