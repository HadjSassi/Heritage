import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import { LOGIN } from './graphql/mutations'

const mockLogin = {
  request: { query: LOGIN, variables: { email: 'test@test.com', password: 'password123' } },
  result: { data: { login: { token: 'fake-token', user: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User' } } } },
}

describe('Login page', () => {
  it('renders login form', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </MockedProvider>
    )
    expect(screen.getByText('🌳 Connexion')).toBeDefined()
  })

  it('shows email and password fields', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </MockedProvider>
    )
    expect(screen.getByText('Email')).toBeDefined()
    expect(screen.getByText('Mot de passe')).toBeDefined()
  })
})

describe('Register page', () => {
  it('renders register form', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </MockedProvider>
    )
    expect(screen.getByText('🌳 Créer un compte')).toBeDefined()
  })
})
