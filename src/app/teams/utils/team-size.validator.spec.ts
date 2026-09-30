import { FormControl } from '@angular/forms';

import { teamSizeValidator } from './team-size.validator';

describe('teamSizeValidator', () => {
  const validator = teamSizeValidator(1, 6);

  it('rejects an empty selection', () => {
    const control = new FormControl<number[]>([]);
    expect(validator(control)).toEqual({ teamTooSmall: { min: 1, actual: 0 } });
  });

  it('rejects more than the max allowed Pokémon', () => {
    const control = new FormControl<number[]>([1, 2, 3, 4, 5, 6, 7]);
    expect(validator(control)).toEqual({ teamTooLarge: { max: 6, actual: 7 } });
  });

  it('accepts a selection within range', () => {
    const control = new FormControl<number[]>([1, 2, 3]);
    expect(validator(control)).toBeNull();
  });

  it('accepts exactly the min and max boundary sizes', () => {
    expect(validator(new FormControl<number[]>([1]))).toBeNull();
    expect(validator(new FormControl<number[]>([1, 2, 3, 4, 5, 6]))).toBeNull();
  });
});
