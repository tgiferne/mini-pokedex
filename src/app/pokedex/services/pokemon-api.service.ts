import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { POKEAPI_GRAPHQL_URL } from '../../common/constants/api.constants';
import { GraphQlClientService, GraphQlErrorMessages } from '../../common/services/graphql-client.service';
import { Pokemon, PokemonAbility } from '../models/pokemon.model';
import { GET_ABILITIES_QUERY, GET_POKEMON_LIST_QUERY } from './pokemon-graphql.queries';
import { GetAbilitiesResponse, GetPokemonListResponse } from './pokemon-graphql.types';
import { mapRawAbilities, mapRawPokemon } from '../utils/pokemon-mapper.util';

const ERROR_MESSAGES: GraphQlErrorMessages = {
  noData: 'No data returned from PokéAPI.',
  unreachable: "Couldn't reach the Pokédex. Please try again.",
};

/**
 * Talks to the public PokéAPI GraphQL endpoint. Every call retries transient
 * failures with a short delay and rethrows a user-friendly error so callers
 * (the store) can surface it to the UI with a Retry action.
 */
@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  private readonly gql = inject(GraphQlClientService);

  /** Fetches a page of Pokémon (list view). */
  getPokemonList$(limit: number, offset = 0): Observable<Pokemon[]> {
    return this.gql
      .request<GetPokemonListResponse>(POKEAPI_GRAPHQL_URL, GET_POKEMON_LIST_QUERY, { limit, offset }, ERROR_MESSAGES)
      .pipe(map((data) => data.pokemon_v2_pokemon.map(mapRawPokemon)));
  }

  /** Fetches the ability list for a single Pokémon (used by the detail panel). */
  getAbilities$(pokemonId: number): Observable<PokemonAbility[]> {
    return this.gql
      .request<GetAbilitiesResponse>(POKEAPI_GRAPHQL_URL, GET_ABILITIES_QUERY, { pokemonId }, ERROR_MESSAGES)
      .pipe(map((data) => mapRawAbilities(data.pokemon_v2_pokemonability)));
  }
}
