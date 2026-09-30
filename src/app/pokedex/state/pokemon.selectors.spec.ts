import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { POKEAPI_GRAPHQL_URL } from '../../common/constants/api.constants';
import { PokemonSelectors } from './pokemon.selectors';
import { PokemonStore } from './pokemon.store';

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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('PokemonSelectors.filteredPokemon$', () => {
  let store: PokemonStore;
  let selectors: PokemonSelectors;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(PokemonStore);
    selectors = TestBed.inject(PokemonSelectors);
    httpMock = TestBed.inject(HttpTestingController);

    httpMock.expectOne(POKEAPI_GRAPHQL_URL).flush({
      data: {
        pokemon_v2_pokemon: [
          rawPokemon(1, 'bulbasaur', 'grass'),
          rawPokemon(4, 'charmander', 'fire'),
          rawPokemon(7, 'squirtle', 'water'),
        ],
      },
    });
  });

  afterEach(() => httpMock.verify());

  it('renders immediately on load, then waits out the 300ms debounce for real keystrokes', async () => {
    const emissions: string[][] = [];
    const sub = selectors.filteredPokemon$.subscribe((items) => emissions.push(items.map((p) => p.name)));

    await wait(10);
    // The seed '' search term isn't debounced — the unfiltered list shows right away.
    expect(emissions[emissions.length - 1]).toEqual(['bulbasaur', 'charmander', 'squirtle']);

    store.setSearchTerm('char');

    await wait(150);
    // The real keystroke's debounce (300ms) hasn't elapsed yet.
    expect(emissions[emissions.length - 1]).toEqual(['bulbasaur', 'charmander', 'squirtle']);

    await wait(200);
    expect(emissions[emissions.length - 1]).toEqual(['charmander']);

    sub.unsubscribe();
  });

  it('re-debounces on each keystroke so only the final term is applied', async () => {
    const emissions: string[][] = [];
    const sub = selectors.filteredPokemon$.subscribe((items) => emissions.push(items.map((p) => p.name)));

    await wait(10); // initial, unfiltered emission

    store.setSearchTerm('c');
    await wait(100);
    store.setSearchTerm('ch');
    await wait(100);
    store.setSearchTerm('char');
    await wait(350);

    expect(emissions[emissions.length - 1]).toEqual(['charmander']);
    // Only the initial emission plus the final debounced one should have fired —
    // 'c' and 'ch' were each superseded before their 300ms debounce elapsed.
    expect(emissions.length).toBe(2);

    sub.unsubscribe();
  });
});
