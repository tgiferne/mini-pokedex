import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { PokedexFiltersComponent } from './components/pokedex-filters/pokedex-filters.component';
import { PokedexTableComponent } from './components/pokedex-table/pokedex-table.component';
import { PokemonDetailPanelComponent } from './components/pokemon-detail-panel/pokemon-detail-panel.component';
import { PageSize } from '../common/constants/pagination.constants';
import { asyncLoading } from '../common/models/async-state.model';
import { SortableColumn } from './models/pokemon.model';
import { PokemonPageResult } from './state/pokemon.selectors';
import { PokemonSelectors } from './state/pokemon.selectors';
import { PokemonStore } from './state/pokemon.store';

@Component({
  selector: 'app-pokedex-page',
  standalone: true,
  imports: [PokedexFiltersComponent, PokedexTableComponent, PokemonDetailPanelComponent],
  templateUrl: './pokedex-page.component.html',
  styleUrl: './pokedex-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexPage {
  protected readonly store = inject(PokemonStore);
  private readonly selectors = inject(PokemonSelectors);

  protected readonly tableState = toSignal(this.selectors.tableState$, {
    initialValue: asyncLoading<PokemonPageResult>(),
  });
  protected readonly availableTypes = toSignal(this.selectors.availableTypes$, { initialValue: [] });
  protected readonly searchTerm = toSignal(this.store.searchTerm$, { initialValue: '' });
  protected readonly typeFilter = toSignal(this.store.typeFilter$, { initialValue: null });
  protected readonly sort = toSignal(this.store.sort$, {
    initialValue: { column: 'name' as SortableColumn, direction: 'asc' as const },
  });

  protected readonly selectedPokemonId = signal<number | null>(null);

  protected onSortChange(column: SortableColumn): void {
    this.store.setSort(column);
  }

  protected onPageSizeChange(size: PageSize): void {
    this.store.setPageSize(size);
  }
}
