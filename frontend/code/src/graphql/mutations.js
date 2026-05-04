import { gql } from '@apollo/client'

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`

export const CREATE_FAMILY_TREE = gql`
  mutation CreateFamilyTree($input: CreateFamilyTreeInput!) {
    createFamilyTree(input: $input) {
      id
      name
      description
      createdAt
    }
  }
`

export const ADD_PERSON = gql`
  mutation AddPerson($treeId: ID!, $input: PersonInput!) {
    addPerson(treeId: $treeId, input: $input) {
      id
      firstName
      lastName
      birthDate
      gender
    }
  }
`

export const UPDATE_PERSON = gql`
  mutation UpdatePerson($id: ID!, $input: PersonInput!) {
    updatePerson(id: $id, input: $input) {
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
    }
  }
`

export const DELETE_PERSON = gql`
  mutation DeletePerson($id: ID!) {
    deletePerson(id: $id)
  }
`

export const ADD_RELATIONSHIP = gql`
  mutation AddRelationship($personId: ID!, $relatedPersonId: ID!, $type: RelationshipType!) {
    addRelationship(personId: $personId, relatedPersonId: $relatedPersonId, type: $type) {
      type
      person {
        id
        firstName
        lastName
      }
    }
  }
`

export const ADD_LIFE_EVENT = gql`
  mutation AddLifeEvent($personId: ID!, $input: LifeEventInput!) {
    addLifeEvent(personId: $personId, input: $input) {
      id
      type
      date
      place
      description
    }
  }
`

export const IMPORT_GEDCOM = gql`
  mutation ImportGedcom($treeId: ID!, $gedcomContent: String!) {
    importGedcom(treeId: $treeId, gedcomContent: $gedcomContent) {
      id
      name
      personCount
    }
  }
`

export const UPLOAD_MEDIA = gql`
  mutation UploadMedia($input: UploadMediaInput!) {
    uploadMedia(input: $input) {
      id
      type
      url
      thumbnailUrl
      title
    }
  }
`

export const ACCEPT_MATCH = gql`
  mutation AcceptMatch($id: ID!) {
    acceptMatch(id: $id) {
      id
      status
    }
  }
`

export const REJECT_MATCH = gql`
  mutation RejectMatch($id: ID!) {
    rejectMatch(id: $id) {
      id
      status
    }
  }
`

