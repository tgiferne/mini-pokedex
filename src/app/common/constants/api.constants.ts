export const POKEAPI_GRAPHQL_URL = 'https://beta.pokeapi.co/graphql/v1beta';
export const MOCK_SERVER_GRAPHQL_URL = 'http://localhost:4000';

export const API_RETRY_COUNT = 2;
export const API_RETRY_DELAY_MS = 800;

/**
 * Number of Pokémon fetched once and cached client-side. The table/search/
 * filter/sort/pagination requirements are all client-side, so the app loads
 * the Kanto dex up front rather than re-querying per page or per keystroke.
 */
export const POKEDEX_FETCH_LIMIT = 151;
