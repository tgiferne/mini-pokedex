/**
 * Discriminated union representing the four required UI states for any view
 * that loads data asynchronously: loading, error, empty, and success.
 */
export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; data: T };

export function asyncLoading<T>(): AsyncState<T> {
  return { status: 'loading' };
}

export function asyncError<T>(message: string): AsyncState<T> {
  return { status: 'error', message };
}

export function asyncEmpty<T>(): AsyncState<T> {
  return { status: 'empty' };
}

export function asyncSuccess<T>(data: T): AsyncState<T> {
  return { status: 'success', data };
}
