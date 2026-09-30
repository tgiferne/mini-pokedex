import { Routes } from '@angular/router';

export const pokedexRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pokedex-page.component').then((m) => m.PokedexPage),
  },
];
