// Discriminated Result for EXPECTED service failures (not-found, duplicate, quota).
// Services return these; controllers map the reason to an HTTP status. Don't throw
// across layers for expected failures.
export type Reason =
  | 'not_found'
  | 'duplicate'
  | 'forbidden'
  | 'unauthorized'
  | 'bad_request'
  | 'quota';

export type Result<T, R extends Reason = Reason> =
  | { state: 'ok'; data: T }
  | { state: 'error'; reason: R };

export const Ok = <T>(data: T): Result<T, never> => ({ state: 'ok', data });
export const Err = <R extends Reason>(reason: R): Result<never, R> => ({ state: 'error', reason });
