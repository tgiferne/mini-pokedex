# Mini Pokédex

A single-page Angular 21 app for browsing Pokémon and building a team, built against the public
PokéAPI GraphQL endpoint and a local mock GraphQL server. See `Pokemon Task.pdf` for the original
brief; this repo follows a set of documented coding conventions (folder structure, naming, component
patterns, commit standards).

## Setup

Requires Node 20+ and npm.

```bash
npm install
```

The app needs **two servers running at once** in development:

```bash
# Terminal 1 — the local mock GraphQL server (teams: fetch/create/delete)
npm run mock-server

# Terminal 2 — the Angular dev server
npm start
```

Then open `http://localhost:4200`. The mock server runs on `http://localhost:4000` (`db.js` at the
repo root is its seed data — two trainers, three teams) and backs the Teams feature's queries and
mutations. The Pokédex itself talks directly to the public
`https://beta.pokeapi.co/graphql/v1beta` endpoint — no local server needed for that part.

```bash
npm test          # unit tests (Vitest)
npm run lint      # angular-eslint (includes template accessibility rules)
npm run build     # production build → dist/
```

## Architecture

- **`pokedex/`** — Pokémon browsing. `PokemonStore` (a `BehaviorSubject`-backed cache of the
  fetched list plus search/type-filter/sort/pagination controls) and `PokemonSelectors` (derived
  `combineLatest`/`map`/`distinctUntilChanged`/`debounce`/`switchMap`/`shareReplay(1)` streams) live
  in `pokedex/state/`. Components are presentational and dumb: they take an `AsyncState<T>` input and
  render the loading/error/empty/success branch, emitting events back up for the page to translate
  into store mutations.
- **`teams/`** — Team building. `TeamStore` applies `createTeam`/`deleteTeam` **optimistically**:
  the UI updates immediately, then either reconciles with the server's response or rolls back and
  shows a toast if the mutation fails. The team builder's Pokémon picker is a debounced typeahead
  against the pokédex's already-cached list (not a new network call).
- **`common/`** — Shared, feature-agnostic pieces: `SkeletonComponent` / `EmptyStateComponent` /
  `ErrorStateComponent` (the three non-success branches of every `AsyncState`), `ToastService`,
  `CacheService` (a safe `localStorage` wrapper), and the design tokens / shimmer mixin in
  `common/styles/_shared.scss`.
- **State management** is hand-rolled RxJS (no NgRx/Akita/NgXS), per the task brief — each store owns
  one `BehaviorSubject` of raw state plus plain methods to mutate it; each selectors file owns the
  derived, `shareReplay`'d streams components actually subscribe to (via `toSignal()`).
- **Signals** are used for component-local UI state (selection, panel open/closed, form chip list),
  `computed()` for derived values (team type distribution/total stats, narrowed `AsyncState` union
  members for templates), and one `effect()` persisting the selected team id to `localStorage`.

### Notable decisions / assumptions

- **No auth in scope.** The mock data seeds two trainers; since there's no login, team
  fetch/create uses a hardcoded `CURRENT_TRAINER_ID = 1` (Ash) — see
  `teams/constants/team.constants.ts`.
- **The Pokédex fetches once, not per page.** Pagination/sort/filter are all client-side
  requirements, so `PokemonStore` loads the first 151 Pokémon (Kanto) up front and caches them,
  rather than re-querying PokéAPI per page or per keystroke. `POKEDEX_FETCH_LIMIT` in
  `common/constants/api.constants.ts` controls this.
- **Search debounce and the initial render.** A naive `debounceTime(300)` on the search-term stream
  delays even the *seed* `''` value, so the table would flash empty for 300ms on first load. The
  selector instead uses `debounce()` with a zero delay for the first emission and 300ms for every
  real keystroke after — covered by a test in `pokemon.selectors.spec.ts`.
- **GraphQL client:** plain `HttpClient.post()` with raw query strings, not Apollo. Apollo's own
  cache would duplicate/compete with the `BehaviorSubject` stores the task explicitly asks for.
- **3D model viewer:** the detail view's Pokémon model uses
  [`@google/model-viewer`](https://modelviewer.dev/) (MIT) rendering GLB meshes from the
  community, MIT-licensed [`Pokemon-3D-api/assets`](https://github.com/Pokemon-3D-api/assets)
  dataset (served straight off `raw.githubusercontent.com`, not their sometimes-sleeping hosted
  API). PokéAPI itself has no 3D data — this is a third-party fan asset set layered on top, with
  its own loading/error+retry handling since it's a real network fetch of a non-trivial-sized
  file. `model-viewer` depends on `three` as a peer dependency (installed explicitly).
  **Known limitation:** a handful of models in that free dataset use a game "battle idle" rest
  pose rather than the classic box-art pose — e.g. Ekans (#23) renders reared up instead of
  coiled. Confirmed there's no alternate pose file for it in the dataset (only `regular`/`shiny`),
  and it's baked into that specific mesh — not something fixable from this app's code without
  different source geometry.

## What I'd improve with more time

- Server-side pagination for the Pokédex (currently trades a slightly larger first fetch for
  fully-client-side table features) — would let the table scale well past Gen 1.
- Trainer selection is hardcoded rather than a real "current user" concept, since there's no auth in
  this task's scope.
- The autocomplete and detail-panel abilities fetch both lean on the same retry/error pattern as the
  main list — a small shared "GraphQL request" helper would remove some duplication between
  `PokemonApiService` and `TeamApiService`.
- Bonus features (virtual scroll, drag-and-drop, type-highlight directive, shimmer micro-animations)
  were skipped in favor of making sure all four required UI states are solid everywhere, per the
  brief's explicit trade-off guidance.
