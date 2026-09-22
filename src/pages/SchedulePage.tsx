import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { RoundResponse } from '../api/types';
import { matchStatusLabel, teamLabel } from '../lib/format';
import { resolveActiveCategory } from '../lib/categorySelection';
import type { TournamentOutletContext } from '../components/TournamentShell';
import CategoryTabs from '../components/CategoryTabs';

export default function SchedulePage() {
  const { tournament, categories } = useOutletContext<TournamentOutletContext>();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [rounds, setRounds] = useState<RoundResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const basePath = `/tornei/${tournament.id}/gironi`;
  const { activeCategory, redirectToId } = resolveActiveCategory(categories, categoryId);

  useEffect(() => {
    if (!activeCategory || activeCategory.competitionFormat === 'TABELLONE') return;
    let cancelled = false;
    setRounds(null);
    setError(null);
    apiGet<RoundResponse[]>(`/api/public/categories/${activeCategory.id}/schedule`)
      .then((data) => {
        if (!cancelled) setRounds(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  if (redirectToId !== null) {
    return <Navigate to={`${basePath}/${redirectToId}`} replace />;
  }
  if (!activeCategory) {
    return <div className="page-message">Nessuna categoria per questo torneo.</div>;
  }

  return (
    <div>
      <CategoryTabs categories={categories} basePath={basePath} />

      {activeCategory.competitionFormat === 'TABELLONE' ? (
        <div className="page-message">
          Questa categoria non prevede un girone: le squadre giocano direttamente il tabellone.
        </div>
      ) : error ? (
        <div className="page-message page-message--error">Errore nel caricamento: {error}</div>
      ) : !rounds ? (
        <div className="page-message">Caricamento...</div>
      ) : rounds.length === 0 ? (
        <div className="page-message">Il calendario del girone non è ancora stato generato.</div>
      ) : (
        <div className="rounds">
          {rounds.map((round) => (
            <section key={round.roundNumber} className="round-card">
              <h2>Giornata {round.roundNumber}</h2>
              <ul className="match-list">
                {round.matches.map((match) => (
                  <li key={match.id} className="match-row">
                    <button
                      type="button"
                      className="match-row__button"
                      disabled={match.status !== 'PLAYED'}
                      onClick={() => navigate(`/tornei/${tournament.id}/partita/${match.id}`)}
                    >
                      <span className="match-row__team">{teamLabel(match.homeTeamName)}</span>
                      <span className="match-row__vs">vs</span>
                      <span className="match-row__team">{teamLabel(match.awayTeamName)}</span>
                      <span className={`match-row__status match-row__status--${match.status.toLowerCase()}`}>
                        {matchStatusLabel(match.status)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
