/** Raw GraphQL documents sent to the local json-graphql-server mock (http://localhost:4000). */

export const GET_TEAMS_QUERY = /* GraphQL */ `
  query GetTeams($trainerId: ID) {
    allTeams(filter: { trainer_id: $trainerId }) {
      id
      trainer_id
      name
      pokemon_ids
      created_at
    }
  }
`;

export const CREATE_TEAM_MUTATION = /* GraphQL */ `
  mutation CreateTeam($trainer_id: ID!, $name: String!, $pokemon_ids: [Int]!, $created_at: String!) {
    createTeam(trainer_id: $trainer_id, name: $name, pokemon_ids: $pokemon_ids, created_at: $created_at) {
      id
      trainer_id
      name
      pokemon_ids
      created_at
    }
  }
`;

export const DELETE_TEAM_MUTATION = /* GraphQL */ `
  mutation DeleteTeam($id: ID!) {
    deleteTeam(id: $id) {
      id
    }
  }
`;
