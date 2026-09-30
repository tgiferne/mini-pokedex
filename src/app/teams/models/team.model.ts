export interface Team {
  id: number;
  trainerId: number;
  name: string;
  pokemonIds: number[];
  createdAt: string;
}

export interface CreateTeamInput {
  trainerId: number;
  name: string;
  pokemonIds: number[];
}
