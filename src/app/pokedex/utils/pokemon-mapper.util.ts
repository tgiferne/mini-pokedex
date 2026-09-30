import { Pokemon, PokemonAbility, StatName } from '../models/pokemon.model';
import { RawPokemon, RawPokemonAbility } from '../services/pokemon-graphql.types';

interface ParsedSpriteUrls {
  spriteUrl: string | null;
  artworkUrl: string | null;
}

/** Parses PokéAPI's loosely-typed `sprites` JSON blob into the two image URLs the app uses. */
function extractSpriteUrls(rawSprites: RawPokemon['pokemon_v2_pokemonsprites']): ParsedSpriteUrls {
  const first = rawSprites[0]?.sprites;
  if (!first) return { spriteUrl: null, artworkUrl: null };

  const parsed = (typeof first === 'string' ? safeJsonParse(first) : first) as Record<string, unknown> | null;
  const other = parsed?.['other'] as Record<string, unknown> | undefined;
  const officialArtwork = other?.['official-artwork'] as Record<string, unknown> | undefined;

  return {
    spriteUrl: asString(parsed?.['front_default']),
    artworkUrl: asString(officialArtwork?.['front_default']) ?? asString(parsed?.['front_default']),
  };
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function mapRawPokemon(raw: RawPokemon): Pokemon {
  const { spriteUrl, artworkUrl } = extractSpriteUrls(raw.pokemon_v2_pokemonsprites);
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
    spriteUrl,
    artworkUrl,
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
