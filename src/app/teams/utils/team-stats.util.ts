import { Pokemon } from '../../pokedex/models/pokemon.model';
import { totalBaseStats } from '../../pokedex/utils/pokemon-filter.util';
import { Team } from '../models/team.model';

export interface TeamStats {
  members: Pokemon[];
  typeDistribution: Record<string, number>;
  totalBaseStats: number;
}

/** Resolves a team's Pokémon ids against the cached pokédex and summarizes type mix + total stats. */
export function computeTeamStats(team: Team, pokemonById: Map<number, Pokemon>): TeamStats {
  const members = team.pokemonIds.map((id) => pokemonById.get(id)).filter((p): p is Pokemon => !!p);

  const typeDistribution: Record<string, number> = {};
  for (const member of members) {
    for (const type of member.types) {
      typeDistribution[type] = (typeDistribution[type] ?? 0) + 1;
    }
  }

  const totalStats = members.reduce((sum, member) => sum + totalBaseStats(member), 0);

  return { members, typeDistribution, totalBaseStats: totalStats };
}
