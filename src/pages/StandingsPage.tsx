import { useEffect, useState } from 'react';
import { Navigate, useOutletContext, useParams } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { StandingRowResponse } from '../api/types';
import { resolveActiveCategory } from '../lib/categorySelection';
import type { TournamentOutletContext } from '../components/TournamentShell';
import CategoryTabs from '../components/CategoryTabs';

export default function StandingsPage() {
  const { tournament, categories } = useOutletContext<TournamentOutletContext>();
  const { categoryId } = useParams();
  const [rows, setRows] = useState<StandingRowResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const basePath = `/tornei/${tournament.id}/classifica`;
  const { activeCategory, redirectToId } = resolveActiveCategory(categories, categoryId);

  useEffect(() => {
    if (!activeCategory || activeCategory.competitionFormat === 'TABELLONE') return;
    let cancelled = false;
    setRows(null);
    setError(null);
    apiGet<StandingRowResponse[]>(`/api/public/categories/${activeCategory.id}/standings`)
      .then((data) => {
        if (!cancelled) setRows(data);
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
          Questa categoria non prevede un girone: non c'è una classifica, guarda direttamente il tabellone.
        </div>
      ) : error ? (
        <div className="page-message page-message--error">Errore nel caricamento: {error}</div>
      ) : !rows ? (
        <div className="page-message">Caricamento...</div>
      ) : rows.length === 0 ? (
        <div className="page-message">Nessuna squadra in questa categoria.</div>
      ) : (
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Squadra</th>
              <th>G</th>
              <th>V</th>
              <th>P</th>
              <th>Pt</th>
              <th>Diff. set</th>
              <th>Diff. game</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.teamId}>
                <td>{row.position}</td>
                <td className="standings-table__team">{row.teamName}</td>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.lost}</td>
                <td className="standings-table__points">{row.points}</td>
                <td>{row.setDiff > 0 ? `+${row.setDiff}` : row.setDiff}</td>
                <td>{row.gameDiff > 0 ? `+${row.gameDiff}` : row.gameDiff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
