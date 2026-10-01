import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import * as echarts from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import { LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { provideEchartsCore } from 'ngx-echarts';

import { POKEAPI_GRAPHQL_URL } from '../../../common/constants/api.constants';
import { PokemonStore } from '../../state/pokemon.store';
import { PokemonDetailPanelComponent } from './pokemon-detail-panel.component';

echarts.use([RadarChart, TooltipComponent, LegendComponent, CanvasRenderer]);

function rawPokemon(id: number, name: string, type: string) {
  return {
    id,
    name,
    height: 10,
    weight: 100,
    pokemon_v2_pokemontypes: [{ pokemon_v2_type: { name: type } }],
    pokemon_v2_pokemonstats: [
      { base_stat: 50, pokemon_v2_stat: { name: 'hp' } },
      { base_stat: 50, pokemon_v2_stat: { name: 'attack' } },
      { base_stat: 50, pokemon_v2_stat: { name: 'defense' } },
      { base_stat: 50, pokemon_v2_stat: { name: 'special-attack' } },
      { base_stat: 50, pokemon_v2_stat: { name: 'special-defense' } },
      { base_stat: 50, pokemon_v2_stat: { name: 'speed' } },
    ],
    pokemon_v2_pokemonsprites: [{ sprites: { front_default: null } }],
  };
}

describe('PokemonDetailPanelComponent navigation', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<PokemonDetailPanelComponent>>;
  let httpMock: HttpTestingController;
  let navigated: number[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideEchartsCore({ echarts })],
    });

    const store = TestBed.inject(PokemonStore);
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne(POKEAPI_GRAPHQL_URL).flush({
      data: {
        pokemon_v2_pokemon: [
          rawPokemon(1, 'bulbasaur', 'grass'),
          rawPokemon(2, 'ivysaur', 'grass'),
          rawPokemon(3, 'venusaur', 'grass'),
          rawPokemon(4, 'charmander', 'fire'),
          rawPokemon(5, 'charmeleon', 'fire'),
        ],
      },
    });
    void store; // just to force the store to instantiate/load before the panel reads it

    // Deliberately never calling fixture.detectChanges() or otherwise
    // yielding to a microtask/timer anywhere in this spec: <model-viewer>
    // needs real WebGL and ngx-echarts needs a real ResizeObserver, neither
    // of which jsdom provides, and — because this is a zoneless app — even
    // an await/setTimeout between a signal write and an assertion is enough
    // for Angular's own scheduler to autonomously render the template (and
    // hit those APIs) independent of whether the test calls detectChanges.
    // Left/Right's list-order navigation (which depends on the async,
    // debounced PokemonSelectors.sortedPokemon$) is covered instead, at the
    // pure-function level, by adjacentPokemonId's tests in
    // pokemon-filter.util.spec.ts. What's left safely testable here is the
    // synchronous, store.snapshot()-driven Up/Down (same-type) navigation,
    // plus the duplicate-click guard shared by all four directions.
    fixture = TestBed.createComponent(PokemonDetailPanelComponent);
    navigated = [];
    fixture.componentInstance.navigate.subscribe((id) => navigated.push(id));
  });

  afterEach(() => httpMock.verify());

  function setId(id: number): void {
    fixture.componentRef.setInput('pokemonId', id);
  }

  it('goToNextOfType steps to the next cached pokémon sharing a type, by dex number', () => {
    setId(4); // charmander (fire)
    (fixture.componentInstance as unknown as { goToNextOfType(): void }).goToNextOfType();
    expect(navigated).toEqual([5]); // charmeleon — the only other fire-type
  });

  it('goToPreviousOfType steps to the previous cached pokémon sharing a type, by dex number', () => {
    setId(5); // charmeleon (fire)
    (fixture.componentInstance as unknown as { goToPreviousOfType(): void }).goToPreviousOfType();
    expect(navigated).toEqual([4]); // charmander
  });

  it('goToNextOfType does nothing when no other cached pokémon shares a type', () => {
    setId(5); // charmeleon is the last fire-type in this fixture
    (fixture.componentInstance as unknown as { goToNextOfType(): void }).goToNextOfType();
    expect(navigated).toEqual([]);
  });

  it('a second call within the cooldown window is ignored (duplicate-click guard)', () => {
    setId(4);
    const instance = fixture.componentInstance as unknown as { goToNextOfType(): void };
    instance.goToNextOfType();
    instance.goToNextOfType(); // fires immediately after — simulates a duplicate DOM event
    expect(navigated).toEqual([5]);
  });
});
