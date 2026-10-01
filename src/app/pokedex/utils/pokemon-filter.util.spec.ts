import { Pokemon } from '../models/pokemon.model';
import { adjacentPokemonId, distinctTypes, filterPokemon, sortPokemon, totalBaseStats } from './pokemon-filter.util';

function makePokemon(overrides: Partial<Pokemon> & Pick<Pokemon, 'id' | 'name'>): Pokemon {
  return {
    height: 10,
    weight: 100,
    types: ['normal'],
    stats: [
      { name: 'hp', baseStat: 50 },
      { name: 'attack', baseStat: 50 },
      { name: 'defense', baseStat: 50 },
      { name: 'special-attack', baseStat: 50 },
      { name: 'special-defense', baseStat: 50 },
      { name: 'speed', baseStat: 50 },
    ],
    spriteUrl: null,
    artworkUrl: null,
    abilities: null,
    ...overrides,
  };
}

const bulbasaur = makePokemon({ id: 1, name: 'bulbasaur', types: ['grass', 'poison'] });
const charmander = makePokemon({ id: 4, name: 'charmander', types: ['fire'] });
const squirtle = makePokemon({
  id: 7,
  name: 'squirtle',
  types: ['water'],
  stats: [
    { name: 'hp', baseStat: 44 },
    { name: 'attack', baseStat: 48 },
    { name: 'defense', baseStat: 65 },
    { name: 'special-attack', baseStat: 50 },
    { name: 'special-defense', baseStat: 64 },
    { name: 'speed', baseStat: 43 },
  ],
});

const roster = [bulbasaur, charmander, squirtle];

describe('filterPokemon', () => {
  it('matches by case-insensitive, partial name', () => {
    expect(filterPokemon(roster, 'CHAR', null).map((p) => p.name)).toEqual(['charmander']);
  });

  it('matches by type regardless of search term', () => {
    expect(filterPokemon(roster, '', 'water').map((p) => p.name)).toEqual(['squirtle']);
  });

  it('combines name and type filters', () => {
    expect(filterPokemon(roster, 'bulba', 'poison').map((p) => p.name)).toEqual(['bulbasaur']);
    expect(filterPokemon(roster, 'bulba', 'water')).toEqual([]);
  });

  it('returns everything when both filters are empty', () => {
    expect(filterPokemon(roster, '', null)).toHaveLength(3);
  });
});

describe('sortPokemon', () => {
  it('sorts by name ascending/descending', () => {
    expect(sortPokemon(roster, 'name', 'asc').map((p) => p.name)).toEqual([
      'bulbasaur',
      'charmander',
      'squirtle',
    ]);
    expect(sortPokemon(roster, 'name', 'desc').map((p) => p.name)).toEqual([
      'squirtle',
      'charmander',
      'bulbasaur',
    ]);
  });

  it('sorts by an individual stat column', () => {
    expect(sortPokemon(roster, 'defense', 'desc').map((p) => p.name)).toEqual([
      'squirtle',
      'bulbasaur',
      'charmander',
    ]);
  });

  it('does not mutate the input array', () => {
    const original = [...roster];
    sortPokemon(roster, 'name', 'desc');
    expect(roster).toEqual(original);
  });
});

describe('distinctTypes', () => {
  it('collects unique, sorted type names across the roster', () => {
    expect(distinctTypes(roster)).toEqual(['fire', 'grass', 'poison', 'water']);
  });
});

describe('totalBaseStats', () => {
  it('sums all six base stats', () => {
    expect(totalBaseStats(squirtle)).toBe(44 + 48 + 65 + 50 + 64 + 43);
  });
});

describe('adjacentPokemonId', () => {
  // roster is [bulbasaur(id1), charmander(id4), squirtle(id7)] — deliberately
  // not in id order, so a passing test proves navigation follows the given
  // list's order, not raw Pokédex number.
  it('returns the next id in list order, not id + 1', () => {
    expect(adjacentPokemonId(roster, 1, 1)).toBe(4); // bulbasaur -> charmander
    expect(adjacentPokemonId(roster, 4, 1)).toBe(7); // charmander -> squirtle
  });

  it('returns the previous id in list order, not id - 1', () => {
    expect(adjacentPokemonId(roster, 7, -1)).toBe(4); // squirtle -> charmander
    expect(adjacentPokemonId(roster, 4, -1)).toBe(1); // charmander -> bulbasaur
  });

  it('returns null past either end of the list', () => {
    expect(adjacentPokemonId(roster, 7, 1)).toBeNull(); // squirtle is last
    expect(adjacentPokemonId(roster, 1, -1)).toBeNull(); // bulbasaur is first
  });

  it('returns null if the current id is not in the list', () => {
    expect(adjacentPokemonId(roster, 999, 1)).toBeNull();
  });

  it('respects a re-sorted list order', () => {
    const byNameDesc = sortPokemon(roster, 'name', 'desc'); // squirtle, charmander, bulbasaur
    expect(adjacentPokemonId(byNameDesc, 7, 1)).toBe(4); // squirtle -> charmander
    expect(adjacentPokemonId(byNameDesc, 4, 1)).toBe(1); // charmander -> bulbasaur
  });
});
