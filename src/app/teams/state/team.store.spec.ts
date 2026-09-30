import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { MOCK_SERVER_GRAPHQL_URL } from '../../common/constants/api.constants';
import { CURRENT_TRAINER_ID } from '../constants/team.constants';
import { TeamStore } from './team.store';

describe('TeamStore', () => {
  let store: TeamStore;
  let httpMock: HttpTestingController;

  const existingTeam = {
    id: '1',
    trainer_id: String(CURRENT_TRAINER_ID),
    name: 'Kanto Starters',
    pokemon_ids: [25, 6, 9],
    created_at: '2024-01-15T10:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(TeamStore);
    httpMock = TestBed.inject(HttpTestingController);

    // Flush the initial loadTeams() call triggered by the store's constructor.
    httpMock.expectOne(MOCK_SERVER_GRAPHQL_URL).flush({ data: { allTeams: [existingTeam] } });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('shows the new team immediately (optimistic) and keeps it after the mutation succeeds', async () => {
    store.createTeam({ name: 'Johto Squad', pokemonIds: [152, 155, 158] });

    const optimisticState = await firstValueFrom(store.state$);
    expect(optimisticState.status).toBe('success');
    if (optimisticState.status === 'success') {
      expect(optimisticState.data.map((t) => t.name)).toContain('Johto Squad');
      expect(optimisticState.data.length).toBe(2);
    }

    const req = httpMock.expectOne(MOCK_SERVER_GRAPHQL_URL);
    req.flush({
      data: {
        createTeam: {
          id: '2',
          trainer_id: String(CURRENT_TRAINER_ID),
          name: 'Johto Squad',
          pokemon_ids: [152, 155, 158],
          created_at: '2024-03-20T14:30:00Z',
        },
      },
    });

    const finalState = await firstValueFrom(store.state$);
    expect(finalState.status).toBe('success');
    if (finalState.status === 'success') {
      expect(finalState.data.find((t) => t.name === 'Johto Squad')?.id).toBe(2);
    }
  });

  it('rolls back the optimistic team and leaves the previous list untouched when the mutation fails', async () => {
    store.createTeam({ name: 'Broken Team', pokemonIds: [1] });

    const req = httpMock.expectOne(MOCK_SERVER_GRAPHQL_URL);
    req.flush({ errors: [{ message: 'name already taken' }] });

    const finalState = await firstValueFrom(store.state$);
    expect(finalState.status).toBe('success');
    if (finalState.status === 'success') {
      expect(finalState.data.map((t) => t.name)).toEqual(['Kanto Starters']);
    }
  });
});
