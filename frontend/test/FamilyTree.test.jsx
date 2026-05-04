import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import { GET_FAMILY_TREES } from '../code/src/graphql/queries'
import FamilyTree from '../code/src/pages/FamilyTree'

const mocks = [
  {
    request: { query: GET_FAMILY_TREES },
    result: { data: { familyTrees: [{ id: '1', name: 'Ma famille', description: '', personCount: 5, createdAt: '2024-01-01', updatedAt: '2024-01-01' }] } },
  },
]

describe('FamilyTree page', () => {
  it('renders tree selector', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter>
          <FamilyTree />
        </MemoryRouter>
      </MockedProvider>
    )
    expect(screen.getByText('+ Nouvel arbre')).toBeDefined()
  })
})

