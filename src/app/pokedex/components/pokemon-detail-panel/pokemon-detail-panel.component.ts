import '@google/model-viewer';
import type { ModelViewerElement } from '@google/model-viewer';

import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, combineLatest, filter, of, startWith, switchMap } from 'rxjs';

import { EmptyStateComponent } from '../../../common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../common/components/error-state/error-state.component';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { POKEMON_3D_MODEL_BASE_URL } from '../../../common/constants/api.constants';
import { AsyncState, asyncEmpty, asyncError, asyncLoading, asyncSuccess } from '../../../common/models/async-state.model';
import { PokemonAbility } from '../../models/pokemon.model';
import { PokemonApiService } from '../../services/pokemon-api.service';
import { PokemonSelectors } from '../../state/pokemon.selectors';
import { PokemonStore } from '../../state/pokemon.store';
import { adjacentPokemonId, totalBaseStats } from '../../utils/pokemon-filter.util';
import { StatRadarChartComponent } from '../stat-radar-chart/stat-radar-chart.component';

/**
 * Full-screen dual "device screen" overlay with complete Pokémon info and a
 * stat radar chart. Base info (name/types/stats/sprite) comes from the
 * already-cached list; abilities and the 3D model are the two pieces that
 * need their own network call, so those are the ones with loading/error
 * handling of their own.
 */
@Component({
  selector: 'app-pokemon-detail-panel',
  standalone: true,
  imports: [TypeBadgeComponent, SkeletonComponent, EmptyStateComponent, ErrorStateComponent, StatRadarChartComponent],
  templateUrl: './pokemon-detail-panel.component.html',
  styleUrl: './pokemon-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // <model-viewer> is a web component, not an Angular component — this schema
  // lets its custom attributes (auto-rotate, camera-controls, ...) through.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PokemonDetailPanelComponent {
  private readonly store = inject(PokemonStore);
  private readonly selectors = inject(PokemonSelectors);
  private readonly api = inject(PokemonApiService);

  readonly pokemonId = input<number | null>(null);
  readonly closePanel = output<void>();
  /** Emits the id to switch to when a directional button (or arrow key) is used. */
  readonly navigate = output<number>();

  protected readonly totalBaseStats = totalBaseStats;

  protected readonly pokemon = computed(() => {
    const id = this.pokemonId();
    if (id == null) return null;
    return this.store.snapshot().find((p) => p.id === id) ?? null;
  });

  // ── 3D model viewer ──────────────────────────────────────────────────────
  /** Camera orbit model-viewer resets to on every new Pokémon: dead-on front view, default distance. */
  private static readonly FRONT_VIEW_ORBIT = '0deg 75deg auto';

  private readonly modelRetryToken = signal(0);
  private readonly modelViewerRef = viewChild<ElementRef<ModelViewerElement>>('modelViewer');

  protected readonly modelUrl = computed(() => {
    const id = this.pokemonId();
    if (id == null) return null;
    const bust = this.modelRetryToken() > 0 ? `?retry=${this.modelRetryToken()}` : '';
    return `${POKEMON_3D_MODEL_BASE_URL}${id}.glb${bust}`;
  });

  protected readonly modelStatus = signal<'loading' | 'error' | 'success'>('loading');

  constructor() {
    // Reset the model viewer's status whenever a different Pokémon is shown.
    // The <model-viewer> element itself persists across the switch (only its
    // src attribute changes), so the camera orbit and the auto-rotate
    // turntable angle both carry over unless explicitly reset — this is what
    // makes each newly-loaded model start from the same front-on pose.
    effect(() => {
      this.pokemonId();
      this.modelStatus.set('loading');
    });
  }

  protected onModelLoad(): void {
    this.modelStatus.set('success');
    this.resetModelPose();
  }

  protected onModelError(): void {
    this.modelStatus.set('error');
  }

  protected retryModel(): void {
    this.modelStatus.set('loading');
    this.modelRetryToken.update((n) => n + 1);
  }

  private resetModelPose(): void {
    const modelViewer = this.modelViewerRef()?.nativeElement;
    if (!modelViewer) return;
    modelViewer.cameraOrbit = PokemonDetailPanelComponent.FRONT_VIEW_ORBIT;
    modelViewer.jumpCameraToGoal();
    modelViewer.resetTurntableRotation(0);
  }

  // ── Left / Right: previous/next row in the pokédex table's current view ──
  /**
   * The same filtered + sorted (but not paginated) list the table itself is
   * showing — so Left/Right always walks the exact order visible on screen,
   * including whatever sort column/direction or search/type filter is
   * currently active, rather than raw National Pokédex number order.
   */
  protected readonly orderedList = toSignal(this.selectors.sortedPokemon$, { initialValue: [] });

  protected readonly hasPrevious = computed(() => {
    const id = this.pokemonId();
    return id != null && adjacentPokemonId(this.orderedList(), id, -1) != null;
  });

  protected readonly hasNext = computed(() => {
    const id = this.pokemonId();
    return id != null && adjacentPokemonId(this.orderedList(), id, 1) != null;
  });

  protected goToPrevious(): void {
    if (!this.claimNavigate()) return;
    const id = this.pokemonId();
    const target = id == null ? null : adjacentPokemonId(this.orderedList(), id, -1);
    if (target != null) this.navigate.emit(target);
  }

  protected goToNext(): void {
    if (!this.claimNavigate()) return;
    const id = this.pokemonId();
    const target = id == null ? null : adjacentPokemonId(this.orderedList(), id, 1);
    if (target != null) this.navigate.emit(target);
  }

  // ── Up / Down: nearest previous/next Pokédex entry sharing a type ───────
  /** Ids (in dex order) of every cached Pokémon that shares at least one type with the current one. */
  private readonly sameTypeIds = computed(() => {
    const current = this.pokemon();
    if (!current) return [];
    const currentTypes = new Set(current.types);
    return this.store
      .snapshot()
      .filter((p) => p.types.some((type) => currentTypes.has(type)))
      .map((p) => p.id)
      .sort((a, b) => a - b);
  });

  private readonly typeNeighborIndex = computed(() => {
    const id = this.pokemonId();
    if (id == null) return -1;
    return this.sameTypeIds().indexOf(id);
  });

  protected readonly hasPreviousOfType = computed(() => this.typeNeighborIndex() > 0);

  protected readonly hasNextOfType = computed(() => {
    const index = this.typeNeighborIndex();
    return index >= 0 && index < this.sameTypeIds().length - 1;
  });

  protected goToPreviousOfType(): void {
    if (!this.claimNavigate()) return;
    const index = this.typeNeighborIndex();
    if (index > 0) this.navigate.emit(this.sameTypeIds()[index - 1]);
  }

  protected goToNextOfType(): void {
    if (!this.claimNavigate()) return;
    const index = this.typeNeighborIndex();
    const ids = this.sameTypeIds();
    if (index >= 0 && index < ids.length - 1) this.navigate.emit(ids[index + 1]);
  }

  /**
   * Guards against a single physical click/keypress somehow dispatching more
   * than one DOM event (a real, if uncommon, browser/trackpad quirk) —
   * without this, a duplicate event firing a second `goToNext()` before
   * Angular has re-rendered `pokemonId` from the first would read the
   * already-advanced id and skip an extra step. Returns false (and does
   * nothing) if another navigation was claimed within the last 250ms.
   */
  private lastNavigateAt = 0;
  private static readonly NAVIGATE_COOLDOWN_MS = 250;

  private claimNavigate(): boolean {
    const now = Date.now();
    if (now - this.lastNavigateAt < PokemonDetailPanelComponent.NAVIGATE_COOLDOWN_MS) return false;
    this.lastNavigateAt = now;
    return true;
  }

  @HostListener('document:keydown.arrowleft')
  protected onArrowLeft(): void {
    if (this.pokemon()) this.goToPrevious();
  }

  @HostListener('document:keydown.arrowright')
  protected onArrowRight(): void {
    if (this.pokemon()) this.goToNext();
  }

  @HostListener('document:keydown.arrowup')
  protected onArrowUp(): void {
    if (this.pokemon()) this.goToNextOfType();
  }

  @HostListener('document:keydown.arrowdown')
  protected onArrowDown(): void {
    if (this.pokemon()) this.goToPreviousOfType();
  }

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
