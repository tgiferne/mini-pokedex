import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { AsyncState, asyncEmpty, asyncError, asyncLoading, asyncSuccess } from '../../common/models/async-state.model';
import { ToastService } from '../../common/services/toast.service';
import { CURRENT_TRAINER_ID } from '../constants/team.constants';
import { CreateTeamInput, Team } from '../models/team.model';
import { TeamApiService } from '../services/team-api.service';

/** Temp ids for optimistic entries are negative so they never collide with real (positive) server ids. */
let nextOptimisticId = -1;

/**
 * BehaviorSubject-based store for the trainer's teams. Creates and deletes
 * are optimistic: the UI updates immediately, and is rolled back with a
 * toast if the mutation fails.
 */
@Injectable({ providedIn: 'root' })
export class TeamStore {
  private readonly api = inject(TeamApiService);
  private readonly toast = inject(ToastService);

  private readonly stateSubject = new BehaviorSubject<AsyncState<Team[]>>(asyncLoading());
  readonly state$: Observable<AsyncState<Team[]>> = this.stateSubject.asObservable();

  constructor() {
    this.loadTeams();
  }

  loadTeams(): void {
    this.stateSubject.next(asyncLoading());
    this.api.getTeams$(CURRENT_TRAINER_ID).subscribe({
      next: (teams) => {
        this.stateSubject.next(teams.length > 0 ? asyncSuccess(teams) : asyncEmpty());
      },
      error: (error: Error) => {
        this.stateSubject.next(asyncError(error.message));
      },
    });
  }

  /** Optimistically adds a team, then confirms or rolls back once the mutation settles. */
  createTeam(input: Omit<CreateTeamInput, 'trainerId'>): void {
    const previous = this.stateSubject.value;
    const previousTeams = previous.status === 'success' ? previous.data : [];

    const optimisticTeam: Team = {
      id: nextOptimisticId--,
      trainerId: CURRENT_TRAINER_ID,
      name: input.name,
      pokemonIds: input.pokemonIds,
      createdAt: new Date().toISOString(),
    };

    this.stateSubject.next(asyncSuccess([optimisticTeam, ...previousTeams]));

    this.api.createTeam$({ ...input, trainerId: CURRENT_TRAINER_ID }).subscribe({
      next: (createdTeam) => {
        const current = this.stateSubject.value;
        const currentTeams = current.status === 'success' ? current.data : [];
        this.stateSubject.next(
          asyncSuccess(currentTeams.map((team) => (team.id === optimisticTeam.id ? createdTeam : team))),
        );
      },
      error: (error: Error) => {
        this.rollbackTeam(optimisticTeam.id, previous);
        this.toast.show(`Couldn't create "${input.name}": ${error.message}`, 'error');
      },
    });
  }

  /** Optimistically removes a team, then confirms or rolls back once the mutation settles. */
  deleteTeam(id: number): void {
    const previous = this.stateSubject.value;
    const previousTeams = previous.status === 'success' ? previous.data : [];
    const removedTeam = previousTeams.find((team) => team.id === id);
    const remaining = previousTeams.filter((team) => team.id !== id);

    this.stateSubject.next(remaining.length > 0 ? asyncSuccess(remaining) : asyncEmpty());

    this.api.deleteTeam$(id).subscribe({
      error: (error: Error) => {
        this.stateSubject.next(previous);
        this.toast.show(`Couldn't delete "${removedTeam?.name ?? 'team'}": ${error.message}`, 'error');
      },
    });
  }

  /** Rolls a failed optimistic create back to the state that preceded it. */
  private rollbackTeam(optimisticId: number, previousState: AsyncState<Team[]>): void {
    const current = this.stateSubject.value;
    if (current.status !== 'success') {
      this.stateSubject.next(previousState);
      return;
    }
    const withoutOptimistic = current.data.filter((team) => team.id !== optimisticId);
    this.stateSubject.next(withoutOptimistic.length > 0 ? asyncSuccess(withoutOptimistic) : asyncEmpty());
  }

  /** Synchronous read of the currently cached teams (used by the unique-name async validator). */
  snapshot(): Team[] {
    const state = this.stateSubject.value;
    return state.status === 'success' ? state.data : [];
  }
}
