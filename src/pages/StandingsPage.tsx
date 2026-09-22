import { useEffect, useState } from 'react';
import { Navigate, useOutletContext, useParams } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { StandingRowResponse } from '../api/types';
import { resolveActiveCategory } from '../lib/categorySelection';
import type { TournamentOutletContext } from '../components/TournamentShell';
import CategoryTabs from '../components/CategoryTabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

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
    return <div className="py-12 text-center text-muted-foreground">Nessuna categoria per questo torneo.</div>;
  }

  return (
    <div>
      <CategoryTabs categories={categories} basePath={basePath} />

      {activeCategory.competitionFormat === 'TABELLONE' ? (
        <div className="py-12 text-center text-muted-foreground">
          Questa categoria non prevede un girone: non c'è una classifica, guarda direttamente il tabellone.
        </div>
      ) : error ? (
        <div className="py-12 text-center text-destructive">Errore nel caricamento: {error}</div>
      ) : !rows ? (
        <div className="py-12 text-center text-muted-foreground">Caricamento...</div>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Nessuna squadra in questa categoria.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">#</TableHead>
              <TableHead>Squadra</TableHead>
              <TableHead className="text-center">G</TableHead>
              <TableHead className="text-center">V</TableHead>
              <TableHead className="text-center">P</TableHead>
              <TableHead className="text-center">Pt</TableHead>
              <TableHead className="text-center">Diff. set</TableHead>
              <TableHead className="text-center">Diff. game</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.teamId}>
                <TableCell className="text-center">{row.position}</TableCell>
                <TableCell className="font-medium">{row.teamName}</TableCell>
                <TableCell className="text-center">{row.played}</TableCell>
                <TableCell className="text-center">{row.won}</TableCell>
                <TableCell className="text-center">{row.lost}</TableCell>
                <TableCell className="text-center font-bold text-primary">{row.points}</TableCell>
                <TableCell className="text-center">{row.setDiff > 0 ? `+${row.setDiff}` : row.setDiff}</TableCell>
                <TableCell className="text-center">{row.gameDiff > 0 ? `+${row.gameDiff}` : row.gameDiff}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
