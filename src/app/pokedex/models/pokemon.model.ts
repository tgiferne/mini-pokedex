export type StatName = 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed';

export interface PokemonStat {
  name: StatName;
  baseStat: number;
}

export interface PokemonAbility {
  name: string;
  isHidden: boolean;
  shortEffect: string | null;
}

/** Normalized Pokémon shape used throughout the app (flattened from the raw GraphQL response). */
export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  stats: PokemonStat[];
  spriteUrl: string | null;
  abilities: PokemonAbility[] | null;
}

export interface PokemonListResult {
  items: Pokemon[];
  total: number;
}

export type SortDirection = 'asc' | 'desc';

export type SortableColumn = StatName | 'name' | 'total';
