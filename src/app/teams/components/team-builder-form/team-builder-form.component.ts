import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { TEAM_MAX_POKEMON, TEAM_MIN_POKEMON, TEAM_NAME_MAX_LENGTH, TEAM_NAME_MIN_LENGTH } from '../../constants/team.constants';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { TeamStore } from '../../state/team.store';
import { teamSizeValidator } from '../../utils/team-size.validator';
import { uniqueTeamNameValidator } from '../../utils/unique-team-name.validator';
import { PokemonAutocompleteComponent } from '../pokemon-autocomplete/pokemon-autocomplete.component';

interface TeamBuilderForm {
  name: FormControl<string>;
  pokemonIds: FormControl<number[]>;
}

/**
 * Reactive form for creating a team: a validated, uniqueness-checked name
 * plus 1–6 Pokémon picked via the autocomplete and shown as removable chips.
 * Submission goes through `TeamStore.createTeam`'s optimistic flow.
 */
@Component({
  selector: 'app-team-builder-form',
  standalone: true,
  imports: [ReactiveFormsModule, PokemonAutocompleteComponent],
  templateUrl: './team-builder-form.component.html',
  styleUrl: './team-builder-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamBuilderFormComponent {
  private readonly store = inject(TeamStore);

  protected readonly selectedPokemon = signal<Pokemon[]>([]);
  protected readonly hasSubmitted = signal(false);

  protected readonly form = new FormGroup<TeamBuilderForm>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(TEAM_NAME_MIN_LENGTH),
        Validators.maxLength(TEAM_NAME_MAX_LENGTH),
      ],
      asyncValidators: [uniqueTeamNameValidator(this.store)],
    }),
    pokemonIds: new FormControl([] as number[], {
      nonNullable: true,
      validators: [teamSizeValidator(TEAM_MIN_POKEMON, TEAM_MAX_POKEMON)],
    }),
  });

  constructor() {
    // Keep the pokemonIds control (the thing validators/submit read) in sync
    // with the chip list the user actually interacts with.
    effect(() => {
      const ids = this.selectedPokemon().map((pokemon) => pokemon.id);
      this.form.controls.pokemonIds.setValue(ids);
    });
  }

  protected addPokemon(pokemon: Pokemon): void {
    if (this.selectedPokemon().some((p) => p.id === pokemon.id)) return;
    this.selectedPokemon.update((list) => [...list, pokemon]);
    this.form.controls.pokemonIds.markAsDirty();
    this.form.controls.pokemonIds.markAsTouched();
  }

  protected removePokemon(id: number): void {
    this.selectedPokemon.update((list) => list.filter((p) => p.id !== id));
    this.form.controls.pokemonIds.markAsDirty();
  }

  protected onSubmit(): void {
    this.hasSubmitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.form.pending) return;

    this.store.createTeam({
      name: this.form.controls.name.value.trim(),
      pokemonIds: this.form.controls.pokemonIds.value,
    });

    this.form.reset({ name: '', pokemonIds: [] });
    this.selectedPokemon.set([]);
    this.hasSubmitted.set(false);
  }
}
