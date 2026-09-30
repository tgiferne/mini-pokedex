import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, map, of, timer } from 'rxjs';

import { TeamStore } from '../state/team.store';

/**
 * Async validator: rejects a team name that already exists for the current
 * trainer (case-insensitive). Debounced via `timer` so it doesn't run on
 * every keystroke; checks against the store's cached team list rather than
 * a fresh network call since the data is already local.
 */
export function uniqueTeamNameValidator(store: TeamStore): AsyncValidatorFn {
  return (control: AbstractControl<string>): Observable<ValidationErrors | null> => {
    const value = (control.value ?? '').trim().toLowerCase();
    if (!value) return of(null);

    return timer(300).pipe(
      map(() => {
        const nameTaken = store.snapshot().some((team) => team.name.trim().toLowerCase() === value);
        return nameTaken ? { nameTaken: true } : null;
      }),
    );
  };
}
