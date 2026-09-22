import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { TournamentResponse } from '../api/types';
import { tournamentStatusLabel } from '../lib/format';

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
    <div className="landing">
      <h1 className="landing__brand">Olympus Tornei</h1>

      {error ? (
        <div className="page-message page-message--error">Errore nel caricamento: {error}</div>
      ) : !tournaments ? (
        <div className="page-message">Caricamento...</div>
      ) : tournaments.length === 0 ? (
        <div className="page-message">Nessun torneo disponibile al momento.</div>
      ) : (
        <ul className="landing__list">
          {tournaments.map((t) => (
            <li key={t.id}>
              <Link to={`/tornei/${t.id}/gironi`} className="landing__item">
                <span className="landing__item-name">{t.name}</span>
                <span className="landing__item-meta">
                  {t.season ? `${t.season} · ` : ''}
                  {tournamentStatusLabel(t.status)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
