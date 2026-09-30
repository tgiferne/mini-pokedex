import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, retry, throwError, timer } from 'rxjs';

import {
  API_RETRY_COUNT,
  API_RETRY_DELAY_MS,
  MOCK_SERVER_GRAPHQL_URL,
} from '../../common/constants/api.constants';
import { CreateTeamInput, Team } from '../models/team.model';
import { CREATE_TEAM_MUTATION, DELETE_TEAM_MUTATION, GET_TEAMS_QUERY } from './team-graphql.queries';
import {
  CreateTeamResponse,
  DeleteTeamResponse,
  GetTeamsResponse,
  GraphQlResponse,
} from './team-graphql.types';
import { mapRawTeam } from '../utils/team-mapper.util';

/**
 * Talks to the local json-graphql-server mock (queries + mutations for
 * teams). Every call retries transient failures once and rethrows a
 * user-friendly error for the store/UI to surface.
 */
@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly http = inject(HttpClient);

  getTeams$(trainerId: number): Observable<Team[]> {
    return this.graphql$<GetTeamsResponse>(GET_TEAMS_QUERY, { trainerId }).pipe(
      map((data) => data.allTeams.map(mapRawTeam)),
    );
  }

  createTeam$(input: CreateTeamInput): Observable<Team> {
    return this.graphql$<CreateTeamResponse>(CREATE_TEAM_MUTATION, {
      trainer_id: input.trainerId,
      name: input.name,
      pokemon_ids: input.pokemonIds,
      created_at: new Date().toISOString(),
    }).pipe(map((data) => mapRawTeam(data.createTeam)));
  }

  deleteTeam$(id: number): Observable<void> {
    return this.graphql$<DeleteTeamResponse>(DELETE_TEAM_MUTATION, { id }).pipe(map(() => undefined));
  }

  private graphql$<T>(query: string, variables: Record<string, unknown>): Observable<T> {
    return this.http.post<GraphQlResponse<T>>(MOCK_SERVER_GRAPHQL_URL, { query, variables }).pipe(
      retry({ count: API_RETRY_COUNT, delay: () => timer(API_RETRY_DELAY_MS) }),
      map((response) => {
        if (response.errors?.length) {
          throw new Error(response.errors[0].message);
        }
        if (!response.data) {
          throw new Error('No data returned from the team server.');
        }
        return response.data;
      }),
      catchError(() =>
        throwError(
          () => new Error("Couldn't reach the team server. Is the mock server running on port 4000?"),
        ),
      ),
    );
  }
}
