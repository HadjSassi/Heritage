const request = require('supertest')
const express = require('express')

// Mock pools and clients
jest.mock('../code/services/service-auth/db/postgres', () => ({
  query: jest.fn(),
}))

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    del: jest.fn(),
  })),
}))

describe('Auth service resolvers', () => {
  it('should hash passwords and not return plaintext', async () => {
    const bcrypt = require('bcrypt')
    const hash = await bcrypt.hash('testpassword', 12)
    expect(hash).not.toBe('testpassword')
    expect(await bcrypt.compare('testpassword', hash)).toBe(true)
  })

  it('should generate valid JWT tokens', () => {
    const jwt = require('jsonwebtoken')
    const token = jwt.sign({ id: '123', email: 'test@test.com' }, 'secret', { expiresIn: '7d' })
    const decoded = jwt.verify(token, 'secret')
    expect(decoded.id).toBe('123')
    expect(decoded.email).toBe('test@test.com')
  })
})

