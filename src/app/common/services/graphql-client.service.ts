import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, retry, throwError, timer } from 'rxjs';

import { API_RETRY_COUNT, API_RETRY_DELAY_MS } from '../constants/api.constants';
import { GraphQlResponse } from '../models/graphql-response.model';

export interface GraphQlErrorMessages {
  /** Shown when the server responds 200 OK but with no `data` field. */
  noData: string;
  /** Shown when the request fails outright (network error, non-2xx) after retries are exhausted. */
  unreachable: string;
}

/**
 * Shared POST-a-GraphQL-query helper used by every feature's API service.
 * Retries transient failures with a short delay, then rethrows a
 * caller-supplied, user-friendly error so the store/UI can surface it with a
 * Retry action — the retry policy and error-shape handling are identical
 * across backends, only the endpoint URL and wording differ per caller.
 */
@Injectable({ providedIn: 'root' })
export class GraphQlClientService {
  private readonly http = inject(HttpClient);

  request<T>(
    url: string,
    query: string,
    variables: Record<string, unknown>,
    messages: GraphQlErrorMessages,
  ): Observable<T> {
    return this.http.post<GraphQlResponse<T>>(url, { query, variables }).pipe(
      retry({ count: API_RETRY_COUNT, delay: () => timer(API_RETRY_DELAY_MS) }),
      map((response) => {
        if (response.errors?.length) {
          throw new Error(response.errors[0].message);
        }
        if (!response.data) {
          throw new Error(messages.noData);
        }
        return response.data;
      }),
      catchError(() => throwError(() => new Error(messages.unreachable))),
    );
  }
}
