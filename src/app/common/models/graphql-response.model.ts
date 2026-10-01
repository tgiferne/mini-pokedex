/** Minimal shape of a GraphQL HTTP response, shared by every feature's GraphQL service. */
export interface GraphQlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}
