import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { BracketResponse } from '../api/types';
import { matchStatusLabel, teamLabel } from '../lib/format';
import type { CategoryOutletContext } from '../components/CategoryLayout';

const POLL_INTERVAL_MS = 15_000;

function roundName(roundIndex: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - roundIndex;
  if (roundsFromEnd === 1) return 'Finale';
  if (roundsFromEnd === 2) return 'Semifinale';
  if (roundsFromEnd === 3) return 'Quarti di finale';
  return `Turno ${roundIndex + 1}`;
}

export default function BracketPage() {
  const { category } = useOutletContext<CategoryOutletContext>();
  const navigate = useNavigate();
  const [bracket, setBracket] = useState<BracketResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBracket(null);
    setError(null);

    const load = () => {
      apiGet<BracketResponse>(`/api/public/categories/${category.id}/bracket`)
        .then((data) => {
          if (!cancelled) setBracket(data);
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message);
        });
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [category.id]);

  if (error) {
    return <div className="page-message page-message--error">Errore nel caricamento: {error}</div>;
  }
  if (!bracket) {
    return <div className="page-message">Caricamento...</div>;
  }
  if (bracket.rounds.length === 0 || bracket.totalRounds === null) {
    return <div className="page-message">Il tabellone non è ancora stato generato.</div>;
  }

  return (
    <div className="bracket">
      {bracket.rounds.map((round) => (
        <section key={round.roundIndex} className="bracket-round">
          <h2>{roundName(round.roundIndex, bracket.totalRounds ?? 0)}</h2>
          <ul className="match-list">
            {round.matches.map((match) => (
              <li key={match.matchId} className="match-row">
                <button
                  type="button"
                  className="match-row__button"
                  disabled={match.status !== 'PLAYED'}
                  onClick={() => navigate(`../match/${match.matchId}`)}
                >
                  <span
                    className={`match-row__team${match.winnerTeamId === match.homeTeamId ? ' match-row__team--winner' : ''}`}
                  >
                    {teamLabel(match.homeTeamName)}
                  </span>
                  <span className="match-row__vs">vs</span>
                  <span
                    className={`match-row__team${match.winnerTeamId === match.awayTeamId ? ' match-row__team--winner' : ''}`}
                  >
                    {teamLabel(match.awayTeamName)}
                  </span>
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
