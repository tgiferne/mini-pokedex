import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, debounce, distinctUntilChanged, map, of, shareReplay, switchMap, timer } from 'rxjs';

import { AsyncState, asyncEmpty, asyncError, asyncLoading, asyncSuccess } from '../../common/models/async-state.model';
import { Pokemon } from '../models/pokemon.model';
import { distinctTypes, filterPokemon, sortPokemon } from '../utils/pokemon-filter.util';
import { PokemonPageState, PokemonSortState, PokemonStore } from './pokemon.store';

export interface PokemonPageResult {
  items: Pokemon[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Derived, read-only view of `PokemonStore`'s raw state: filtered, sorted,
 * paged, and combined with loading/error/empty status so components can
 * subscribe to a single stream per view.
 */
@Injectable({ providedIn: 'root' })
export class PokemonSelectors {
  private readonly store = inject(PokemonStore);

  /** All cached Pokémon once the initial fetch has succeeded (empty array otherwise). */
  readonly allPokemon$: Observable<Pokemon[]> = this.store.listState$.pipe(
    map((state) => (state.status === 'success' ? state.data : [])),
    distinctUntilChanged(),
    shareReplay(1),
  );

  /** Type names available for the dropdown filter, derived from the cached list. */
  readonly availableTypes$: Observable<string[]> = this.allPokemon$.pipe(
    map(distinctTypes),
    distinctUntilChanged((a, b) => a.length === b.length && a.every((type, i) => type === b[i])),
    shareReplay(1),
  );

  /**
   * Name search, debounced and deduped, applied together with the type
   * filter. `switchMap` mirrors the shape an API-backed typeahead would use
   * (cancel any in-flight lookup when a newer term arrives) even though the
   * lookup here resolves synchronously against the cached list.
   *
   * Uses `debounce` (not `debounceTime`) with a zero delay for the very
   * first value so the table renders immediately on load instead of
   * flashing empty for 300ms before the seed '' search term "settles".
   * Only real keystrokes after that are debounced by 300ms.
   */
  private isFirstSearchEmission = true;
  private readonly debouncedSearchTerm$ = this.store.searchTerm$.pipe(
    debounce(() => {
      const delay = this.isFirstSearchEmission ? 0 : 300;
      this.isFirstSearchEmission = false;
      return timer(delay);
    }),
    distinctUntilChanged(),
  );

  readonly filteredPokemon$: Observable<Pokemon[]> = combineLatest([
    this.allPokemon$,
    this.debouncedSearchTerm$,
    this.store.typeFilter$,
  ]).pipe(
    switchMap(([items, term, type]) => of(filterPokemon(items, term, type))),
    shareReplay(1),
  );

  readonly sortedPokemon$: Observable<Pokemon[]> = combineLatest([
    this.filteredPokemon$,
    this.store.sort$.pipe(distinctUntilChanged(sortStateEqual)),
  ]).pipe(
    map(([items, sort]) => sortPokemon(items, sort.column, sort.direction)),
    shareReplay(1),
  );

  readonly pagedPokemon$: Observable<PokemonPageResult> = combineLatest([
    this.sortedPokemon$,
    this.store.page$.pipe(distinctUntilChanged(pageStateEqual)),
  ]).pipe(
    map(([items, page]) => {
      const start = page.page * page.pageSize;
      return {
        items: items.slice(start, start + page.pageSize),
        total: items.length,
        page: page.page,
        pageSize: page.pageSize,
      };
    }),
    shareReplay(1),
  );

  /** Single stream the Pokédex table binds to: loading/error/empty/success, ready to render. */
  readonly tableState$: Observable<AsyncState<PokemonPageResult>> = combineLatest([
    this.store.listState$,
    this.pagedPokemon$,
  ]).pipe(
    map(([listState, paged]) => {
      if (listState.status === 'loading') return asyncLoading<PokemonPageResult>();
      if (listState.status === 'error') return asyncError<PokemonPageResult>(listState.message);
      if (paged.total === 0) return asyncEmpty<PokemonPageResult>();
      return asyncSuccess(paged);
    }),
    shareReplay(1),
  );
}

function sortStateEqual(a: PokemonSortState, b: PokemonSortState): boolean {
  return a.column === b.column && a.direction === b.direction;
}

function pageStateEqual(a: PokemonPageState, b: PokemonPageState): boolean {
  return a.page === b.page && a.pageSize === b.pageSize;
}
