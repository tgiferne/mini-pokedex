import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { pokemonTypeColor } from '../../constants/pokemon-type-colors.constants';

/** Small colored pill for a Pokémon type name (e.g. "fire", "water"). */
@Component({
  selector: 'app-type-badge',
  standalone: true,
  templateUrl: './type-badge.component.html',
  styleUrl: './type-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeBadgeComponent {
  readonly type = input.required<string>();

  protected readonly color = computed(() => pokemonTypeColor(this.type()));
}
