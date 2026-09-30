import { Pokemon, PokemonAbility, StatName } from '../models/pokemon.model';
import { RawPokemon, RawPokemonAbility } from '../services/pokemon-graphql.types';

/** Extracts a usable sprite URL from PokéAPI's loosely-typed `sprites` JSON blob. */
function extractSpriteUrl(rawSprites: RawPokemon['pokemon_v2_pokemonsprites']): string | null {
  const first = rawSprites[0]?.sprites;
  if (!first) return null;

  const parsed = typeof first === 'string' ? safeJsonParse(first) : first;
  const frontDefault = (parsed as Record<string, unknown> | null)?.['front_default'];
  return typeof frontDefault === 'string' ? frontDefault : null;
}

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function mapRawPokemon(raw: RawPokemon): Pokemon {
  return {
    id: raw.id,
    name: raw.name,
    height: raw.height,
    weight: raw.weight,
    types: raw.pokemon_v2_pokemontypes.map((t) => t.pokemon_v2_type.name),
    stats: raw.pokemon_v2_pokemonstats.map((s) => ({
      name: s.pokemon_v2_stat.name as StatName,
      baseStat: s.base_stat,
    })),
    spriteUrl: extractSpriteUrl(raw.pokemon_v2_pokemonsprites),
    abilities: null,
  };
}

export function mapRawAbilities(raw: RawPokemonAbility[]): PokemonAbility[] {
  return raw.map((entry) => ({
    name: entry.pokemon_v2_ability.name,
    isHidden: entry.is_hidden,
    shortEffect: entry.pokemon_v2_ability.pokemon_v2_abilityeffecttexts[0]?.short_effect ?? null,
  }));
}
