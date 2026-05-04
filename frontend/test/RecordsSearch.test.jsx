import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import RecordsSearch from '../code/src/pages/RecordsSearch'

describe('RecordsSearch page', () => {
  it('renders search bar', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter>
          <RecordsSearch />
        </MemoryRouter>
      </MockedProvider>
    )
    expect(screen.getByText('SuperSearch — Archives historiques')).toBeDefined()
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

