import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { POKEDEX_FETCH_LIMIT } from '../../common/constants/api.constants';
import {
  DEFAULT_PAGE_SIZE,
  PageSize,
} from '../../common/constants/pagination.constants';
import { AsyncState, asyncEmpty, asyncError, asyncLoading, asyncSuccess } from '../../common/models/async-state.model';
import { Pokemon, SortDirection, SortableColumn } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';

export interface PokemonSortState {
  column: SortableColumn;
  direction: SortDirection;
}

export interface PokemonPageState {
  page: number;
  pageSize: PageSize;
}

/**
 * BehaviorSubject-based store holding the cached Pokémon list plus the
 * current search/filter/sort/pagination controls. Derived views (filtered,
 * sorted, paged data) live in `pokemon.selectors.ts` — this store only owns
 * raw state and the mutations that change it.
 */
@Injectable({ providedIn: 'root' })
export class PokemonStore {
  private readonly api = inject(PokemonApiService);

  private readonly listStateSubject = new BehaviorSubject<AsyncState<Pokemon[]>>(asyncLoading());
  readonly listState$: Observable<AsyncState<Pokemon[]>> = this.listStateSubject.asObservable();

  private readonly searchTermSubject = new BehaviorSubject<string>('');
  readonly searchTerm$: Observable<string> = this.searchTermSubject.asObservable();

  private readonly typeFilterSubject = new BehaviorSubject<string | null>(null);
  readonly typeFilter$: Observable<string | null> = this.typeFilterSubject.asObservable();

  private readonly sortSubject = new BehaviorSubject<PokemonSortState>({
    column: 'name',
    direction: 'asc',
  });
  readonly sort$: Observable<PokemonSortState> = this.sortSubject.asObservable();

  private readonly pageSubject = new BehaviorSubject<PokemonPageState>({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  readonly page$: Observable<PokemonPageState> = this.pageSubject.asObservable();

  constructor() {
    this.loadPokemon();
  }

  /** (Re)fetches the cached Pokémon list from the API. Used on init and Retry. */
  loadPokemon(): void {
    this.listStateSubject.next(asyncLoading());
    this.api.getPokemonList$(POKEDEX_FETCH_LIMIT).subscribe({
      next: (items) => {
        this.listStateSubject.next(items.length > 0 ? asyncSuccess(items) : asyncEmpty());
      },
      error: (error: Error) => {
        this.listStateSubject.next(asyncError(error.message));
      },
    });
  }

  /** Updates the name-search term and resets pagination to the first page. */
  setSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
    this.resetToFirstPage();
  }

  /** Updates the active type filter (or clears it with `null`) and resets pagination to the first page. */
  setTypeFilter(type: string | null): void {
    this.typeFilterSubject.next(type);
    this.resetToFirstPage();
  }

  /** Sorts by `column`; toggles direction if it's already the active sort column, otherwise defaults to ascending. */
  setSort(column: SortableColumn): void {
    const current = this.sortSubject.value;
    const direction: SortDirection =
      current.column === column && current.direction === 'asc' ? 'desc' : 'asc';
    this.sortSubject.next({ column, direction });
  }

  /** Sets the current page index (0-based) without changing the page size. */
  setPage(page: number): void {
    this.pageSubject.next({ ...this.pageSubject.value, page });
  }

  /** Changes the page size and resets to the first page. */
  setPageSize(pageSize: PageSize): void {
    this.pageSubject.next({ page: 0, pageSize });
  }

  /** Reads the currently cached Pokémon, if any, synchronously (used by the team builder picker). */
  snapshot(): Pokemon[] {
    const state = this.listStateSubject.value;
    return state.status === 'success' ? state.data : [];
  }

  private resetToFirstPage(): void {
    this.pageSubject.next({ ...this.pageSubject.value, page: 0 });
  }
}
