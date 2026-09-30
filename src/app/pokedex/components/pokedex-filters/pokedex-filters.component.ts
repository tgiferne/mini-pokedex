import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Presentational filter bar: debounced text search (debouncing happens
 * upstream in the store) plus a type dropdown. Purely controlled — all state
 * lives in the parent / store.
 */
@Component({
  selector: 'app-pokedex-filters',
  standalone: true,
  templateUrl: './pokedex-filters.component.html',
  styleUrl: './pokedex-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexFiltersComponent {
  readonly searchTerm = input<string>('');
  readonly availableTypes = input<string[]>([]);
  readonly selectedType = input<string | null>(null);

  readonly searchTermChange = output<string>();
  readonly selectedTypeChange = output<string | null>();

  onSearchInput(value: string): void {
    this.searchTermChange.emit(value);
  }

  onTypeChange(value: string): void {
    this.selectedTypeChange.emit(value === '' ? null : value);
  }
}
