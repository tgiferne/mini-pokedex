import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, retry, throwError, timer } from 'rxjs';

import { API_RETRY_COUNT, API_RETRY_DELAY_MS, POKEAPI_GRAPHQL_URL } from '../../common/constants/api.constants';
import { Pokemon, PokemonAbility } from '../models/pokemon.model';
import { GET_ABILITIES_QUERY, GET_POKEMON_LIST_QUERY } from './pokemon-graphql.queries';
import {
  GetAbilitiesResponse,
  GetPokemonListResponse,
  GraphQlResponse,
} from './pokemon-graphql.types';
import { mapRawAbilities, mapRawPokemon } from '../utils/pokemon-mapper.util';

/**
 * Talks to the public PokéAPI GraphQL endpoint. Every call retries transient
 * failures with a short delay and rethrows a user-friendly error so callers
 * (the store) can surface it to the UI with a Retry action.
 */
@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  private readonly http = inject(HttpClient);

  /** Fetches a page of Pokémon (list view). */
  getPokemonList$(limit: number, offset = 0): Observable<Pokemon[]> {
    return this.graphql$<GetPokemonListResponse>(GET_POKEMON_LIST_QUERY, { limit, offset }).pipe(
      map((data) => data.pokemon_v2_pokemon.map(mapRawPokemon)),
    );
  }

  /** Fetches the ability list for a single Pokémon (used by the detail panel). */
  getAbilities$(pokemonId: number): Observable<PokemonAbility[]> {
    return this.graphql$<GetAbilitiesResponse>(GET_ABILITIES_QUERY, { pokemonId }).pipe(
      map((data) => mapRawAbilities(data.pokemon_v2_pokemonability)),
    );
  }

  private graphql$<T>(query: string, variables: Record<string, unknown>): Observable<T> {
    return this.http.post<GraphQlResponse<T>>(POKEAPI_GRAPHQL_URL, { query, variables }).pipe(
      retry({ count: API_RETRY_COUNT, delay: () => timer(API_RETRY_DELAY_MS) }),
      map((response) => {
        if (response.errors?.length) {
          throw new Error(response.errors[0].message);
        }
        if (!response.data) {
          throw new Error('No data returned from PokéAPI.');
        }
        return response.data;
      }),
      catchError(() =>
        throwError(() => new Error("Couldn't reach the Pokédex. Please try again.")),
      ),
    );
  }
}
