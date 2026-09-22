import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { TournamentResponse } from '../api/types';
import { tournamentStatusLabel } from '../lib/format';
import { Badge } from '../components/ui/badge';

export default function TournamentListPage() {
  const [tournaments, setTournaments] = useState<TournamentResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<TournamentResponse[]>('/api/public/tournaments')
      .then((data) => {
        if (!cancelled) setTournaments(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      <h1 className="mb-8 text-3xl font-semibold">Olympus Tornei</h1>

      {error ? (
        <div className="py-12 text-center text-destructive">Errore nel caricamento: {error}</div>
      ) : !tournaments ? (
        <div className="py-12 text-center text-muted-foreground">Caricamento...</div>
      ) : tournaments.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Nessun torneo disponibile al momento.</div>
      ) : (
        <ul className="flex flex-col gap-2.5 text-left">
          {tournaments.map((t) => (
            <li key={t.id}>
              <Link
                to={`/tornei/${t.id}/gironi`}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card px-5 py-4 text-card-foreground transition-colors hover:bg-muted/50"
              >
                <span className="font-semibold">{t.name}</span>
                <span className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
                  {t.season}
                  <Badge variant="secondary">{tournamentStatusLabel(t.status)}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
