import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { MOCK_SERVER_GRAPHQL_URL } from '../../common/constants/api.constants';
import { GraphQlClientService, GraphQlErrorMessages } from '../../common/services/graphql-client.service';
import { CreateTeamInput, Team } from '../models/team.model';
import { CREATE_TEAM_MUTATION, DELETE_TEAM_MUTATION, GET_TEAMS_QUERY } from './team-graphql.queries';
import { CreateTeamResponse, DeleteTeamResponse, GetTeamsResponse } from './team-graphql.types';
import { mapRawTeam } from '../utils/team-mapper.util';

const ERROR_MESSAGES: GraphQlErrorMessages = {
  noData: 'No data returned from the team server.',
  unreachable: "Couldn't reach the team server. Is the mock server running on port 4000?",
};

/**
 * Talks to the local json-graphql-server mock (queries + mutations for
 * teams). Every call retries transient failures once and rethrows a
 * user-friendly error for the store/UI to surface.
 */
@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly gql = inject(GraphQlClientService);

  /** Fetches all teams belonging to the given trainer. */
  getTeams$(trainerId: number): Observable<Team[]> {
    return this.gql
      .request<GetTeamsResponse>(MOCK_SERVER_GRAPHQL_URL, GET_TEAMS_QUERY, { trainerId }, ERROR_MESSAGES)
      .pipe(map((data) => data.allTeams.map(mapRawTeam)));
  }

  /** Creates a new team and returns the server-assigned record (including its real id). */
  createTeam$(input: CreateTeamInput): Observable<Team> {
    return this.gql
      .request<CreateTeamResponse>(
        MOCK_SERVER_GRAPHQL_URL,
        CREATE_TEAM_MUTATION,
        {
          trainer_id: input.trainerId,
          name: input.name,
          pokemon_ids: input.pokemonIds,
          created_at: new Date().toISOString(),
        },
        ERROR_MESSAGES,
      )
      .pipe(map((data) => mapRawTeam(data.createTeam)));
  }

  /** Deletes the team with the given id. */
  deleteTeam$(id: number): Observable<void> {
    return this.gql
      .request<DeleteTeamResponse>(MOCK_SERVER_GRAPHQL_URL, DELETE_TEAM_MUTATION, { id }, ERROR_MESSAGES)
      .pipe(map(() => undefined));
  }
}
