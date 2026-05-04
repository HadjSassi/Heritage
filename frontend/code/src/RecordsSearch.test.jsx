import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import RecordsSearch from './pages/RecordsSearch'

describe('RecordsSearch page', () => {
  it('renders search bar heading', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter>
          <RecordsSearch />
        </MemoryRouter>
      </MockedProvider>
    )
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
  })

  it('renders filter dropdowns', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter>
          <RecordsSearch />
        </MemoryRouter>
      </MockedProvider>
    )
    expect(screen.getByText('Tous les types')).toBeDefined()
  })
})
