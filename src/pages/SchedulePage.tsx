import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { RoundResponse } from '../api/types';
import { resolveActiveCategory } from '../lib/categorySelection';
import type { PublicOutletContext } from '../components/PublicShell';
import CategoryTabs from '../components/CategoryTabs';
import { GradientBorder } from '../components/GradientBorder';
import { MatchScoreRow } from '../components/MatchScoreRow';

export default function SchedulePage() {
  const { tournament, categories } = useOutletContext<PublicOutletContext>();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [rounds, setRounds] = useState<RoundResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const basePath = `/tornei/${tournament?.id}/gironi`;
  const { activeCategory, redirectToId } = resolveActiveCategory(categories ?? [], categoryId);

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
    return <div className="py-12 text-center text-muted-foreground">Nessuna categoria per questo torneo.</div>;
  }

  return (
    <div>
      <CategoryTabs categories={categories ?? []} basePath={basePath} />

      {activeCategory.competitionFormat === 'TABELLONE' ? (
        <div className="py-12 text-center text-muted-foreground">
          Questa categoria non prevede un girone: le squadre giocano direttamente il tabellone.
        </div>
      ) : error ? (
        <div className="py-12 text-center text-destructive">Errore nel caricamento: {error}</div>
      ) : !rounds ? (
        <div className="py-12 text-center text-muted-foreground">Caricamento...</div>
      ) : rounds.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Il calendario del girone non è ancora stato generato.</div>
      ) : (
        <div className="flex flex-col gap-6">
          {rounds.map((round) => (
            <section key={round.roundNumber}>
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Giornata {round.roundNumber}
              </h2>
              <ul className="flex flex-col gap-2">
                {round.matches.map((match) => {
                  const played = match.status === 'PLAYED';
                  return (
                    <li key={match.id}>
                      <GradientBorder>
                        <button
                          type="button"
                          className="w-full rounded-xl bg-card px-4 py-3 text-left text-card-foreground disabled:cursor-default"
                          disabled={!played}
                          onClick={() => navigate(`/tornei/${tournament?.id}/partita/${match.id}`)}
                        >
                          <MatchScoreRow match={match} />
                        </button>
                      </GradientBorder>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
