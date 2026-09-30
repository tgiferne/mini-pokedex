import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Validates a `number[]` control's length is within `[min, max]` (inclusive). */
export function teamSizeValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl<number[]>): ValidationErrors | null => {
    const length = (control.value ?? []).length;
    if (length < min) return { teamTooSmall: { min, actual: length } };
    if (length > max) return { teamTooLarge: { max, actual: length } };
    return null;
  };
}
