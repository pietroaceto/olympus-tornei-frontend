import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { RoundResponse } from '../api/types';
import { matchStatusLabel, teamLabel } from '../lib/format';
import type { CategoryOutletContext } from '../components/CategoryLayout';

export default function SchedulePage() {
  const { category } = useOutletContext<CategoryOutletContext>();
  const navigate = useNavigate();
  const [rounds, setRounds] = useState<RoundResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRounds(null);
    setError(null);
    apiGet<RoundResponse[]>(`/api/public/categories/${category.id}/schedule`)
      .then((data) => {
        if (!cancelled) setRounds(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [category.id]);

  if (error) {
    return <div className="page-message page-message--error">Errore nel caricamento: {error}</div>;
  }
  if (!rounds) {
    return <div className="page-message">Caricamento...</div>;
  }
  if (rounds.length === 0) {
    return <div className="page-message">Il calendario del girone non è ancora stato generato.</div>;
  }

  return (
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
                  onClick={() => navigate(`../match/${match.id}`)}
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
  );
}
