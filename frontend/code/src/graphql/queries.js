import { gql } from '@apollo/client'

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      firstName
      lastName
      createdAt
    }
  }
`

export const GET_FAMILY_TREES = gql`
  query GetFamilyTrees {
    familyTrees {
      id
      name
      description
      personCount
      createdAt
      updatedAt
    }
  }
`

export const GET_FAMILY_TREE = gql`
  query GetFamilyTree($id: ID!) {
    familyTree(id: $id) {
      id
      name
      persons {
        id
        firstName
        lastName
        birthDate
        deathDate
        gender
        photoUrl
        relationships {
          type
          person {
            id
            firstName
            lastName
            photoUrl
          }
        }
      }
    }
  }
`

export const GET_PERSON = gql`
  query GetPerson($id: ID!) {
    person(id: $id) {
      id
      firstName
      lastName
      birthDate
      birthPlace
      deathDate
      deathPlace
      gender
      photoUrl
      biography
      lifeEvents {
        id
        type
        date
        place
        description
      }
      relationships {
        type
        person {
          id
          firstName
          lastName
          photoUrl
          birthDate
        }
      }
    }
  }
`

export const SEARCH_RECORDS = gql`
  query SearchRecords($query: String!, $filters: RecordFilters, $page: Int, $limit: Int) {
    searchRecords(query: $query, filters: $filters, page: $page, limit: $limit) {
      total
      results {
        id
        type
        title
        date
        place
        firstName
        lastName
        description
        source
        imageUrl
      }
    }
  }
`

export const GET_MEDIA = gql`
  query GetMedia($personId: ID) {
    media(personId: $personId) {
      id
      type
      url
      thumbnailUrl
      title
      description
      date
      person {
        id
        firstName
        lastName
      }
    }
  }
`

export const GET_MATCHES = gql`
  query GetMatches {
    matches {
      id
      type
      confidence
      status
      person {
        id
        firstName
        lastName
        birthDate
      }
      matchedPerson {
        id
        firstName
        lastName
        birthDate
      }
      matchedRecord {
        id
        title
        type
        date
        place
      }
    }
  }
`

