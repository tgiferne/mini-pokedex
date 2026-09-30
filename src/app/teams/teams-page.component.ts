import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { asyncLoading } from '../common/models/async-state.model';
import { CacheService } from '../common/services/cache.service';
import { PokemonSelectors } from '../pokedex/state/pokemon.selectors';
import { Team } from './models/team.model';
import { TeamBuilderFormComponent } from './components/team-builder-form/team-builder-form.component';
import { TeamListComponent } from './components/team-list/team-list.component';
import { SELECTED_TEAM_CACHE_KEY } from './constants/team-cache.constants';
import { TeamStore } from './state/team.store';

@Component({
  selector: 'app-teams-page',
  standalone: true,
  imports: [TeamBuilderFormComponent, TeamListComponent],
  templateUrl: './teams-page.component.html',
  styleUrl: './teams-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsPageComponent {
  protected readonly store = inject(TeamStore);
  private readonly pokemonSelectors = inject(PokemonSelectors);
  private readonly cache = inject(CacheService);

  protected readonly teamsState = toSignal(this.store.state$, { initialValue: asyncLoading<Team[]>() });
  protected readonly allPokemon = toSignal(this.pokemonSelectors.allPokemon$, { initialValue: [] });

  protected readonly selectedTeamId = signal<number | null>(
    this.cache.get<number>(SELECTED_TEAM_CACHE_KEY),
  );

  constructor() {
    // Persist the selected team across reloads.
    effect(() => {
      const id = this.selectedTeamId();
      if (id == null) {
        this.cache.remove(SELECTED_TEAM_CACHE_KEY);
      } else {
        this.cache.set(SELECTED_TEAM_CACHE_KEY, id);
      }
    });
  }

  protected onSelectTeam(id: number): void {
    this.selectedTeamId.update((current) => (current === id ? null : id));
  }

  protected onDeleteTeam(id: number): void {
    if (this.selectedTeamId() === id) this.selectedTeamId.set(null);
    this.store.deleteTeam(id);
  }
}
