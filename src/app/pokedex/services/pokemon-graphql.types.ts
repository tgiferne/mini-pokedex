/** Raw shapes as returned by the PokéAPI GraphQL endpoint, before normalization. */

export interface RawPokemonType {
  pokemon_v2_type: { name: string };
}

export interface RawPokemonStat {
  base_stat: number;
  pokemon_v2_stat: { name: string };
}

export interface RawPokemonSprite {
  sprites: string | Record<string, unknown>;
}

export interface RawPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  pokemon_v2_pokemontypes: RawPokemonType[];
  pokemon_v2_pokemonstats: RawPokemonStat[];
  pokemon_v2_pokemonsprites: RawPokemonSprite[];
}

export interface GetPokemonListResponse {
  pokemon_v2_pokemon: RawPokemon[];
}

export interface RawPokemonAbility {
  pokemon_v2_ability: {
    name: string;
    pokemon_v2_abilityeffecttexts: { short_effect: string }[];
  };
  is_hidden: boolean;
}

export interface GetAbilitiesResponse {
  pokemon_v2_pokemonability: RawPokemonAbility[];
}

export interface GraphQlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}
