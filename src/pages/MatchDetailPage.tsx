import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { MatchDetailResponse, PlayerResponse } from '../api/types';
import { resultTypeLabel, teamLabel } from '../lib/format';

function pairLabel(p1: PlayerResponse | null, p2: PlayerResponse | null): string {
  const names = [p1?.name, p2?.name].filter(Boolean);
  return names.length > 0 ? names.join(' / ') : '—';
}

export default function MatchDetailPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMatch(null);
    setError(null);
    apiGet<MatchDetailResponse>(`/api/public/matches/${matchId}`)
      .then((data) => {
        if (!cancelled) setMatch(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  if (error) {
    return <div className="page-message page-message--error">Errore nel caricamento: {error}</div>;
  }
  if (!match) {
    return <div className="page-message">Caricamento...</div>;
  }

  return (
    <div className="match-detail">
      <button type="button" className="link-button" onClick={() => navigate(-1)}>
        ← Torna indietro
      </button>

      <h2>
        {teamLabel(match.homeTeamName)} <span className="match-row__vs">vs</span>{' '}
        {teamLabel(match.awayTeamName)}
      </h2>
      {match.status === 'PLAYED' && <p className="match-detail__result">{resultTypeLabel(match.resultType)}</p>}

      {match.subMatches.length === 0 ? (
        <div className="page-message">Nessun risultato inserito.</div>
      ) : (
        <table className="submatch-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Coppia casa</th>
              <th>Coppia ospite</th>
              <th>Set</th>
              <th>Esito</th>
            </tr>
          </thead>
          <tbody>
            {match.subMatches.map((sub) => (
              <tr key={sub.id}>
                <td>{sub.ordine}</td>
                <td>{pairLabel(sub.homePlayer1, sub.homePlayer2)}</td>
                <td>{pairLabel(sub.awayPlayer1, sub.awayPlayer2)}</td>
                <td>{sub.sets.map((s) => `${s.homeGames}-${s.awayGames}`).join(', ')}</td>
                <td>{sub.setsWonBy === 'PARITA' ? 'Parità' : sub.setsWonBy === 'HOME' ? 'Casa' : 'Ospite'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
