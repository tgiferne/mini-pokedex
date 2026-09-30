import { FormControl } from '@angular/forms';
import { from } from 'rxjs';

import { Team } from '../models/team.model';
import { TeamStore } from '../state/team.store';
import { uniqueTeamNameValidator } from './unique-team-name.validator';

function fakeStore(teams: Team[]): TeamStore {
  return { snapshot: () => teams } as unknown as TeamStore;
}

describe('uniqueTeamNameValidator', () => {
  const existingTeams: Team[] = [
    { id: 1, trainerId: 1, name: 'Kanto Starters', pokemonIds: [1], createdAt: '2024-01-01T00:00:00Z' },
  ];

  it('flags a name that already exists, case-insensitively', async () => {
    const validator = uniqueTeamNameValidator(fakeStore(existingTeams));
    const control = new FormControl('kanto starters');

    const result = await new Promise((resolve) => {
      from(validator(control)).subscribe(resolve);
    });

    expect(result).toEqual({ nameTaken: true });
  });

  it('allows a name that does not collide', async () => {
    const validator = uniqueTeamNameValidator(fakeStore(existingTeams));
    const control = new FormControl('Johto Squad');

    const result = await new Promise((resolve) => {
      from(validator(control)).subscribe(resolve);
    });

    expect(result).toBeNull();
  });

  it('skips the check for an empty value without waiting', () => {
    const validator = uniqueTeamNameValidator(fakeStore(existingTeams));
    const control = new FormControl('   ');

    let result: unknown;
    let emitted = false;
    from(validator(control)).subscribe((value) => {
      result = value;
      emitted = true;
    });

    expect(emitted).toBe(true);
    expect(result).toBeNull();
  });
});
