export interface RawTeam {
  id: string | number;
  trainer_id: string | number;
  name: string;
  pokemon_ids: number[];
  created_at: string;
}

export interface GetTeamsResponse {
  allTeams: RawTeam[];
}

export interface CreateTeamResponse {
  createTeam: RawTeam;
}

export interface DeleteTeamResponse {
  deleteTeam: { id: string | number };
}

export interface GraphQlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}
