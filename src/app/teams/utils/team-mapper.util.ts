import { Team } from '../models/team.model';
import { RawTeam } from '../services/team-graphql.types';

export function mapRawTeam(raw: RawTeam): Team {
  return {
    id: Number(raw.id),
    trainerId: Number(raw.trainer_id),
    name: raw.name,
    pokemonIds: raw.pokemon_ids,
    createdAt: raw.created_at,
  };
}
