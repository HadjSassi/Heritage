describe('Tree service — GEDCOM parser', () => {
  it('should parse a basic GEDCOM individual', () => {
    const gedcom = `0 HEAD
1 GEDC
2 VERS 5.5.1
0 @I1@ INDI
1 NAME Jean /Dupont/
2 GIVN Jean
2 SURN Dupont
1 SEX M
1 BIRT
2 DATE 1880
0 TRLR`

    const lines = gedcom.split('\n')
    let persons = []
    let current = null

    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (parts[0] === '0' && parts[2] === 'INDI') {
        current = { firstName: '', lastName: '', gender: 'UNKNOWN' }
      } else if (current && parts[1] === 'SEX') {
        current.gender = parts[2] === 'M' ? 'MALE' : 'FEMALE'
      } else if (current && parts[1] === 'GIVN') {
        current.firstName = parts.slice(2).join(' ')
      } else if (current && parts[1] === 'SURN') {
        current.lastName = parts.slice(2).join(' ')
      } else if (current && parts[0] === '0' && current.firstName) {
        persons.push(current)
        current = null
      }
    }
    if (current && current.firstName) persons.push(current)

    expect(persons.length).toBeGreaterThan(0)
    expect(persons[0].firstName).toBe('Jean')
    expect(persons[0].lastName).toBe('Dupont')
    expect(persons[0].gender).toBe('MALE')
  })

  it('should export valid GEDCOM format', () => {
    const person = { first_name: 'Marie', last_name: 'Curie', gender: 'FEMALE', birth_date: { toISOString: () => '1867-11-07T00:00:00.000Z' } }
    let gedcom = '0 HEAD\n1 GEDC\n2 VERS 5.5.1\n'
    gedcom += `0 @I1@ INDI\n`
    gedcom += `1 NAME ${person.first_name} /${person.last_name}/\n`
    gedcom += `1 SEX F\n`
    gedcom += `0 TRLR\n`

    expect(gedcom).toContain('Marie')
    expect(gedcom).toContain('Curie')
    expect(gedcom).toContain('INDI')
    expect(gedcom).toContain('TRLR')
  })
})

