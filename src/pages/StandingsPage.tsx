import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { StandingRowResponse } from '../api/types';
import type { CategoryOutletContext } from '../components/CategoryLayout';

export default function StandingsPage() {
  const { category } = useOutletContext<CategoryOutletContext>();
  const [rows, setRows] = useState<StandingRowResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    apiGet<StandingRowResponse[]>(`/api/public/categories/${category.id}/standings`)
      .then((data) => {
        if (!cancelled) setRows(data);
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
  if (!rows) {
    return <div className="page-message">Caricamento...</div>;
  }
  if (rows.length === 0) {
    return <div className="page-message">Nessuna squadra in questa categoria.</div>;
  }

  return (
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
  );
}
