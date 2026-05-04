describe('Matching service — confidence scoring', () => {
  function computeConfidence(a, b) {
    let score = 0
    const maxScore = 3
    if (a.firstName && b.firstName) {
      const sim = a.firstName.toLowerCase() === b.firstName.toLowerCase() ? 1
        : a.firstName.toLowerCase().startsWith(b.firstName.toLowerCase().slice(0, 3)) ? 0.5 : 0
      score += sim
    }
    if (a.lastName && b.lastName) {
      score += a.lastName.toLowerCase() === b.lastName.toLowerCase() ? 1 : 0
    }
    if (a.birthDate && b.birthDate) {
      const yearA = parseInt(a.birthDate.slice(0, 4))
      const yearB = parseInt(b.birthDate.slice(0, 4))
      score += Math.abs(yearA - yearB) <= 2 ? 1 : 0
    }
    return score / maxScore
  }

  it('returns 1.0 for perfect match', () => {
    const p = { firstName: 'Jean', lastName: 'Dupont', birthDate: '1880-01-01' }
    expect(computeConfidence(p, p)).toBe(1)
  })

  it('returns 0 for no match', () => {
    const a = { firstName: 'Jean', lastName: 'Dupont', birthDate: '1880-01-01' }
    const b = { firstName: 'Alice', lastName: 'Martin', birthDate: '1950-06-15' }
    expect(computeConfidence(a, b)).toBe(0)
  })

  it('returns partial score for partial match', () => {
    const a = { firstName: 'Jean', lastName: 'Dupont', birthDate: '1880-01-01' }
    const b = { firstName: 'Jean', lastName: 'Bernard', birthDate: '1882-03-10' }
    const score = computeConfidence(a, b)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1)
  })
})

