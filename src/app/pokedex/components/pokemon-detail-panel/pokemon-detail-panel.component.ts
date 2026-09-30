import { ChangeDetectionStrategy, Component, HostListener, computed, inject, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, combineLatest, filter, of, startWith, switchMap } from 'rxjs';

import { EmptyStateComponent } from '../../../common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../common/components/error-state/error-state.component';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { AsyncState, asyncEmpty, asyncError, asyncLoading, asyncSuccess } from '../../../common/models/async-state.model';
import { PokemonAbility } from '../../models/pokemon.model';
import { PokemonApiService } from '../../services/pokemon-api.service';
import { PokemonStore } from '../../state/pokemon.store';
import { totalBaseStats } from '../../utils/pokemon-filter.util';
import { StatRadarChartComponent } from '../stat-radar-chart/stat-radar-chart.component';

/**
 * Full-screen dual "device screen" overlay with complete Pokémon info and a
 * stat radar chart. Base info (name/types/stats/sprite) comes from the
 * already-cached list; only abilities require a fresh network call, so
 * that's the only piece with its own loading/error/empty/success state.
 */
@Component({
  selector: 'app-pokemon-detail-panel',
  standalone: true,
  imports: [TypeBadgeComponent, SkeletonComponent, EmptyStateComponent, ErrorStateComponent, StatRadarChartComponent],
  templateUrl: './pokemon-detail-panel.component.html',
  styleUrl: './pokemon-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailPanelComponent {
  private readonly store = inject(PokemonStore);
  private readonly api = inject(PokemonApiService);

  readonly pokemonId = input<number | null>(null);
  readonly closePanel = output<void>();

  protected readonly totalBaseStats = totalBaseStats;

  protected readonly pokemon = computed(() => {
    const id = this.pokemonId();
    if (id == null) return null;
    return this.store.snapshot().find((p) => p.id === id) ?? null;
  });

  private readonly retrySubject = new Subject<void>();

  private readonly abilitiesState$ = combineLatest([
    toObservable(this.pokemonId).pipe(filter((id): id is number => id != null)),
    this.retrySubject.pipe(startWith(undefined)),
  ]).pipe(
    switchMap(([id]) =>
      this.api.getAbilities$(id).pipe(
        switchMap((abilities: PokemonAbility[]) =>
          of(abilities.length > 0 ? asyncSuccess(abilities) : asyncEmpty<PokemonAbility[]>()),
        ),
        catchError((error: Error) => of(asyncError<PokemonAbility[]>(error.message))),
        startWith(asyncLoading<PokemonAbility[]>()),
      ),
    ),
  );

  protected readonly abilitiesState = toSignal(this.abilitiesState$, {
    initialValue: asyncLoading<PokemonAbility[]>() as AsyncState<PokemonAbility[]>,
  });

  protected readonly abilities = computed(() => {
    const state = this.abilitiesState();
    return state.status === 'success' ? state.data : [];
  });

  protected readonly abilitiesErrorMessage = computed(() => {
    const state = this.abilitiesState();
    return state.status === 'error' ? state.message : '';
  });

  protected retryAbilities(): void {
    this.retrySubject.next();
  }

  protected onBackdropClick(): void {
    this.closePanel.emit();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.pokemon()) this.closePanel.emit();
  }
}
