export const POKEAPI_GRAPHQL_URL = 'https://beta.pokeapi.co/graphql/v1beta';
export const MOCK_SERVER_GRAPHQL_URL = 'http://localhost:4000';

/**
 * Community-maintained, MIT-licensed GLB model set (Pokemon-3D-api/assets on
 * GitHub, served via raw.githubusercontent.com — covers gens 1-9, id-named
 * files). Used for the detail view's 3D model viewer.
 */
export const POKEMON_3D_MODEL_BASE_URL =
  'https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/regular/';

export const API_RETRY_COUNT = 2;
export const API_RETRY_DELAY_MS = 800;

/**
 * Number of Pokémon fetched once and cached client-side. The table/search/
 * filter/sort/pagination requirements are all client-side, so the app loads
 * the Kanto dex up front rather than re-querying per page or per keystroke.
 */
export const POKEDEX_FETCH_LIMIT = 151;
