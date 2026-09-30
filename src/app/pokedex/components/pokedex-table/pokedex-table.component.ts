import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { EmptyStateComponent } from '../../../common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../common/components/error-state/error-state.component';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { PAGE_SIZE_OPTIONS, PageSize } from '../../../common/constants/pagination.constants';
import { AsyncState } from '../../../common/models/async-state.model';
import { StatLookupPipe } from '../../../common/pipes/stat-lookup.pipe';
import { PokemonPageResult } from '../../state/pokemon.selectors';
import { PokemonSortState } from '../../state/pokemon.store';
import { SortableColumn, StatName } from '../../models/pokemon.model';
import { totalBaseStats } from '../../utils/pokemon-filter.util';

interface StatColumn {
  label: string;
  column: StatName;
}

const STAT_COLUMNS: StatColumn[] = [
  { label: 'HP', column: 'hp' },
  { label: 'Attack', column: 'attack' },
  { label: 'Defense', column: 'defense' },
  { label: 'Sp.Atk', column: 'special-attack' },
  { label: 'Sp.Def', column: 'special-defense' },
  { label: 'Speed', column: 'speed' },
];

@Component({
  selector: 'app-pokedex-table',
  standalone: true,
  imports: [SkeletonComponent, EmptyStateComponent, ErrorStateComponent, TypeBadgeComponent, StatLookupPipe],
  templateUrl: './pokedex-table.component.html',
  styleUrl: './pokedex-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexTableComponent {
  readonly state = input.required<AsyncState<PokemonPageResult>>();
  readonly sort = input.required<PokemonSortState>();

  readonly sortChange = output<SortableColumn>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<PageSize>();
  readonly rowSelect = output<number>();
  readonly retry = output<void>();

  protected readonly statColumns = STAT_COLUMNS;
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly totalBaseStats = totalBaseStats;

  /** Narrowed success payload, or null for any other status — avoids repeated union narrowing in the template. */
  protected readonly pageResult = computed(() => {
    const state = this.state();
    return state.status === 'success' ? state.data : null;
  });

  protected readonly errorMessage = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.message : '';
  });

  protected readonly totalPages = computed(() => {
    const result = this.pageResult();
    if (!result) return 0;
    return Math.max(1, Math.ceil(result.total / result.pageSize));
  });

  protected sortIndicator(column: SortableColumn): string {
    const sort = this.sort();
    if (sort.column !== column) return '';
    return sort.direction === 'asc' ? '▲' : '▼';
  }

  protected onPageSizeSelect(value: string): void {
    this.pageSizeChange.emit(Number(value) as PageSize);
  }
}
