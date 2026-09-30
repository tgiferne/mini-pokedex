import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { EmptyStateComponent } from '../../../common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../common/components/error-state/error-state.component';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { AsyncState } from '../../../common/models/async-state.model';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { Team } from '../../models/team.model';
import { computeTeamStats } from '../../utils/team-stats.util';

interface TeamRow {
  team: Team;
  typeDistribution: [string, number][];
  totalBaseStats: number;
  memberCount: number;
}

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [SkeletonComponent, EmptyStateComponent, ErrorStateComponent, TypeBadgeComponent],
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamListComponent {
  readonly state = input.required<AsyncState<Team[]>>();
  readonly allPokemon = input<Pokemon[]>([]);
  readonly selectedTeamId = input<number | null>(null);

  readonly teamSelect = output<number>();
  readonly teamDelete = output<number>();
  readonly retry = output<void>();

  protected readonly errorMessage = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.message : '';
  });

  protected readonly rows = computed<TeamRow[]>(() => {
    const state = this.state();
    if (state.status !== 'success') return [];

    const pokemonById = new Map(this.allPokemon().map((pokemon) => [pokemon.id, pokemon]));
    return state.data.map((team) => {
      const stats = computeTeamStats(team, pokemonById);
      return {
        team,
        typeDistribution: Object.entries(stats.typeDistribution),
        totalBaseStats: stats.totalBaseStats,
        memberCount: team.pokemonIds.length,
      };
    });
  });
}
