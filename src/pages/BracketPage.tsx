import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { BracketResponse } from '../api/types';
import { resolveActiveCategory } from '../lib/categorySelection';
import type { PublicOutletContext } from '../components/PublicShell';
import CategoryTabs from '../components/CategoryTabs';
import Bracket from '../components/Bracket';

const POLL_INTERVAL_MS = 15_000;

export default function BracketPage() {
  const { tournament, categories } = useOutletContext<PublicOutletContext>();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [bracket, setBracket] = useState<BracketResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const basePath = `/tornei/${tournament?.id}/tabellone`;
  const { activeCategory, redirectToId } = resolveActiveCategory(categories ?? [], categoryId);

  useEffect(() => {
    if (!activeCategory) return;
    let cancelled = false;
    setBracket(null);
    setError(null);

    const load = () => {
      apiGet<BracketResponse>(`/api/public/categories/${activeCategory.id}/bracket`)
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
  }, [activeCategory]);

  if (redirectToId !== null) {
    return <Navigate to={`${basePath}/${redirectToId}`} replace />;
  }
  if (!activeCategory) {
    return <div className="py-12 text-center text-muted-foreground">Nessuna categoria per questo torneo.</div>;
  }

  return (
    <div>
      <CategoryTabs categories={categories ?? []} basePath={basePath} />

      {error ? (
        <div className="py-12 text-center text-destructive">Errore nel caricamento: {error}</div>
      ) : !bracket ? (
        <div className="py-12 text-center text-muted-foreground">Caricamento...</div>
      ) : bracket.rounds.length === 0 || bracket.totalRounds === null ? (
        <div className="py-12 text-center text-muted-foreground">Il tabellone non è ancora stato generato.</div>
      ) : (
        <Bracket
          rounds={bracket.rounds}
          totalRounds={bracket.totalRounds}
          onMatchClick={(matchId) => navigate(`/tornei/${tournament?.id}/partita/${matchId}`)}
          isMatchClickable={(match) => match.status === 'PLAYED'}
        />
      )}
    </div>
  );
}
