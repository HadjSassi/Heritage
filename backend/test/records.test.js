describe('Records service — search filters', () => {
  it('builds correct Elasticsearch query with type filter', () => {
    const filters = { type: 'BIRTH', country: 'France' }
    const must = [{ multi_match: { query: 'Dupont', fields: ['firstName', 'lastName'] } }]
    if (filters.type) must.push({ term: { type: filters.type } })
    if (filters.country) must.push({ term: { country: filters.country } })

    expect(must).toHaveLength(3)
    expect(must[1]).toEqual({ term: { type: 'BIRTH' } })
    expect(must[2]).toEqual({ term: { country: 'France' } })
  })

  it('maps Elasticsearch hit to HistoricalRecord', () => {
    const hit = {
      _id: 'abc123',
      _source: { type: 'BIRTH', title: 'Naissance Jean Dupont', firstName: 'Jean', lastName: 'Dupont', date: '1880', place: 'Paris', createdAt: '2024-01-01T00:00:00Z' },
    }
    const record = { id: hit._id, ...hit._source }
    expect(record.id).toBe('abc123')
    expect(record.firstName).toBe('Jean')
    expect(record.type).toBe('BIRTH')
  })
})

