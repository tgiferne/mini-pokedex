import { Pipe, PipeTransform } from '@angular/core';

import { PokemonStat, StatName } from '../../pokedex/models/pokemon.model';

/** Looks up a single base stat value by name from a Pokémon's stat array. */
@Pipe({ name: 'statLookup', standalone: true, pure: true })
export class StatLookupPipe implements PipeTransform {
  transform(stats: PokemonStat[], name: StatName): number {
    return stats.find((stat) => stat.name === name)?.baseStat ?? 0;
  }
}
