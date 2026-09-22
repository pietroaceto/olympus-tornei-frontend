import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { CategoryResponse, TournamentResponse } from '../api/types';
import { sortCategories, tournamentStatusLabel } from '../lib/format';

export interface TournamentOutletContext {
  tournament: TournamentResponse;
  categories: CategoryResponse[];
}

const SECTIONS = [
  { key: 'gironi', label: 'Gironi' },
  { key: 'classifica', label: 'Classifica' },
  { key: 'tabellone', label: 'Tabellone' },
] as const;

function currentSection(pathname: string): string {
  const match = SECTIONS.find((s) => pathname.includes(`/${s.key}`));
  return match ? match.key : 'gironi';
}

/**
 * Estrae l'eventuale :categoryId dall'URL corrente (es. "3" da
 * "/tornei/5/gironi/3"), così cambiando sezione dalla sidebar si resta sulla
 * stessa categoria invece di tornare sempre alla prima (Gold).
 */
function currentCategoryId(pathname: string, tournamentId: string | undefined, section: string): string | null {
  const prefix = `/tornei/${tournamentId}/${section}/`;
  if (!pathname.startsWith(prefix)) {
    return null;
  }
  return pathname.slice(prefix.length).split('/')[0] || null;
}

export default function TournamentShell() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [tournament, setTournament] = useState<TournamentResponse | null>(null);
  const [allTournaments, setAllTournaments] = useState<TournamentResponse[] | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([
      apiGet<TournamentResponse>(`/api/public/tournaments/${tournamentId}`),
      apiGet<TournamentResponse[]>('/api/public/tournaments'),
      apiGet<CategoryResponse[]>(`/api/public/tournaments/${tournamentId}/categories`),
    ])
      .then(([t, all, cats]) => {
        if (cancelled) return;
        setTournament(t);
        setAllTournaments(all);
        setCategories(sortCategories(cats));
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  if (error) {
    return <div className="page-message page-message--error">Errore nel caricamento: {error}</div>;
  }
  if (!tournament || !allTournaments || !categories) {
    return <div className="page-message">Caricamento...</div>;
  }

  const section = currentSection(location.pathname);
  const categoryId = currentCategoryId(location.pathname, tournamentId, section);

  return (
    <div className="tournament-shell">
      <header className="tournament-header">
        <Link to="/" className="tournament-header__brand">
          Olympus Tornei
        </Link>
        <div className="tournament-header__current">
          <select
            className="tournament-switcher"
            value={tournament.id}
            onChange={(e) => navigate(`/tornei/${e.target.value}/${section}`)}
          >
            {allTournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.season ? ` (${t.season})` : ''}
              </option>
            ))}
          </select>
          <span className="tournament-header__status">{tournamentStatusLabel(tournament.status)}</span>
        </div>
      </header>

      <div className="tournament-body">
        <nav className="tournament-sidebar">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`tournament-sidebar__item${section === s.key ? ' tournament-sidebar__item--active' : ''}`}
              onClick={() =>
                navigate(categoryId ? `/tornei/${tournamentId}/${s.key}/${categoryId}` : `/tornei/${tournamentId}/${s.key}`)
              }
            >
              {s.label}
            </button>
          ))}
        </nav>

        <main className="tournament-content">
          <Outlet context={{ tournament, categories } satisfies TournamentOutletContext} />
        </main>
      </div>
    </div>
  );
}
