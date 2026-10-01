import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';

import { EmptyStateComponent } from '../../../common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../common/components/error-state/error-state.component';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { AsyncState, asyncEmpty, asyncError, asyncLoading, asyncSuccess } from '../../../common/models/async-state.model';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { PokemonStore } from '../../../pokedex/state/pokemon.store';
import { filterPokemon } from '../../../pokedex/utils/pokemon-filter.util';

/**
 * Debounced Pokémon typeahead against the already-cached pokédex list.
 * Emits `pokemonSelected` when the user picks a suggestion; the parent form
 * is responsible for turning that into a chip and excluding it from future
 * suggestions via `excludeIds`.
 */
@Component({
  selector: 'app-pokemon-autocomplete',
  standalone: true,
  imports: [ReactiveFormsModule, SkeletonComponent, EmptyStateComponent, ErrorStateComponent],
  templateUrl: './pokemon-autocomplete.component.html',
  styleUrl: './pokemon-autocomplete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonAutocompleteComponent {
  private readonly store = inject(PokemonStore);

  readonly excludeIds = input<number[]>([]);
  readonly disabled = input<boolean>(false);
  /** Id applied to the internal text input, so a parent `<label for>` can reference it. */
  readonly inputId = input<string | null>(null);
  readonly pokemonSelected = output<Pokemon>();

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly isOpen = signal(false);

  private readonly searchTerm$ = this.searchControl.valueChanges.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
  );

  private readonly rawResultsState = toSignal(
    combineLatest([this.store.listState$, this.searchTerm$]).pipe(
      map(([listState, term]): AsyncState<Pokemon[]> => {
        if (listState.status === 'loading') return asyncLoading<Pokemon[]>();
        if (listState.status === 'error') return asyncError<Pokemon[]>(listState.message);
        if (term.trim().length === 0) return asyncEmpty<Pokemon[]>();

        const allPokemon = listState.status === 'success' ? listState.data : [];
        const matches = filterPokemon(allPokemon, term, null).slice(0, 8);
        return matches.length > 0 ? asyncSuccess(matches) : asyncEmpty<Pokemon[]>();
      }),
    ),
    { initialValue: asyncEmpty<Pokemon[]>() },
  );

  /** Same as `rawResultsState` but with already-selected Pokémon filtered out. */
  protected readonly resultsState = computed<AsyncState<Pokemon[]>>(() => {
    const state = this.rawResultsState();
    if (state.status !== 'success') return state;
    const excluded = this.excludeIds();
    const filtered = state.data.filter((pokemon) => !excluded.includes(pokemon.id));
    return filtered.length > 0 ? asyncSuccess(filtered) : asyncEmpty<Pokemon[]>();
  });

  protected readonly errorMessage = computed(() => {
    const state = this.resultsState();
    return state.status === 'error' ? state.message : '';
  });

  protected readonly matchList = computed(() => {
    const state = this.resultsState();
    return state.status === 'success' ? state.data : [];
  });

  protected select(pokemon: Pokemon): void {
    this.pokemonSelected.emit(pokemon);
    this.searchControl.setValue('');
    this.isOpen.set(false);
  }

  protected onFocus(): void {
    this.isOpen.set(true);
  }

  protected onBlur(): void {
    // Delay so a mousedown on a suggestion registers before the panel closes.
    setTimeout(() => this.isOpen.set(false), 150);
  }

  protected retry(): void {
    this.store.loadPokemon();
  }
}
