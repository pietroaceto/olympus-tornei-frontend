import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { CategoryResponse, TournamentResponse } from '../api/types';
import { sortCategories } from '../lib/format';

export default function HomeRedirect() {
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<TournamentResponse[]>('/api/public/tournaments')
      .then(async (tournaments) => {
        if (tournaments.length === 0) {
          throw new Error('Nessun torneo disponibile');
        }
        const active = tournaments.find((t) => t.status === 'ACTIVE') ?? tournaments[0];
        const categories = await apiGet<CategoryResponse[]>(
          `/api/public/tournaments/${active.id}/categories`,
        );
        if (categories.length === 0) {
          throw new Error('Nessuna categoria disponibile per questo torneo');
        }
        const firstCategory = sortCategories(categories)[0];
        if (!cancelled) {
          setTarget(`/t/${active.id}/c/${firstCategory.id}/schedule`);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <div className="page-message page-message--error">Errore nel caricamento: {error}</div>;
  }
  if (!target) {
    return <div className="page-message">Caricamento...</div>;
  }
  return <Navigate to={target} replace />;
}
