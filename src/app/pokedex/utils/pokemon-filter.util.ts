import { Pokemon, SortDirection, SortableColumn } from '../models/pokemon.model';

export function filterPokemon(items: Pokemon[], searchTerm: string, type: string | null): Pokemon[] {
  const term = searchTerm.trim().toLowerCase();
  return items.filter((pokemon) => {
    const matchesName = term.length === 0 || pokemon.name.toLowerCase().includes(term);
    const matchesType = !type || pokemon.types.includes(type);
    return matchesName && matchesType;
  });
}

function statValue(pokemon: Pokemon, column: SortableColumn): number | string {
  if (column === 'name') return pokemon.name.toLowerCase();
  if (column === 'total') return pokemon.stats.reduce((sum, stat) => sum + stat.baseStat, 0);
  return pokemon.stats.find((stat) => stat.name === column)?.baseStat ?? 0;
}

export function sortPokemon(items: Pokemon[], column: SortableColumn, direction: SortDirection): Pokemon[] {
  const sign = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const valueA = statValue(a, column);
    const valueB = statValue(b, column);
    if (valueA < valueB) return -1 * sign;
    if (valueA > valueB) return 1 * sign;
    return 0;
  });
}

export function distinctTypes(items: Pokemon[]): string[] {
  const types = new Set<string>();
  for (const pokemon of items) {
    for (const type of pokemon.types) types.add(type);
  }
  return [...types].sort();
}

export function totalBaseStats(pokemon: Pokemon): number {
  return pokemon.stats.reduce((sum, stat) => sum + stat.baseStat, 0);
}
