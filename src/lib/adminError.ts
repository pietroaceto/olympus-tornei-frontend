import { ApiError } from '../api/client';

export function adminErrorMessage(err: unknown, onUnauthorized: () => void): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      onUnauthorized();
    }
    return err.message;
  }
  return err instanceof Error ? err.message : 'Errore sconosciuto';
}
