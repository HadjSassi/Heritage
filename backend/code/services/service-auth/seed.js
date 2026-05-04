#!/usr/bin/env node
/**
 * Seed script — creates the admin user in PostgreSQL.
 * Reads credentials from environment variables (see .env.example).
 *
 * Usage:
 *   node seed.js
 * Or via Makefile:
 *   make seed
 */

const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'heritage',
  user: process.env.POSTGRES_USER || 'heritage',
  password: process.env.POSTGRES_PASSWORD || 'heritage_pass',
})

async function seed() {
  const firstName = process.env.ADMIN_FIRST_NAME || 'Heritage'
  const lastName  = process.env.ADMIN_LAST_NAME  || 'Heritage'
  const email     = process.env.ADMIN_EMAIL      || 'heritage@heritage.heritage'
  const password  = process.env.ADMIN_PASSWORD   || 'heritage'

  console.log(`🌱 Seeding admin user: ${email}`)

  const hashed = await bcrypt.hash(password, 12)

  await pool.query(`
    INSERT INTO users (email, password, first_name, last_name)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO UPDATE
      SET password   = EXCLUDED.password,
          first_name = EXCLUDED.first_name,
          last_name  = EXCLUDED.last_name,
          updated_at = NOW()
  `, [email, hashed, firstName, lastName])

  const { rows } = await pool.query('SELECT id, email, first_name, last_name FROM users WHERE email = $1', [email])
  console.log('✅ Admin user ready:', rows[0])

  await pool.end()
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})

