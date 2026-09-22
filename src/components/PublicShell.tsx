import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, Outlet } from 'react-router-dom';
import { CalendarDays, Home, ListOrdered, Network, Trophy } from 'lucide-react';
import { apiGet } from '../api/client';
import type { CategoryResponse, TournamentResponse } from '../api/types';
import { sortCategories } from '../lib/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';

export interface PublicOutletContext {
  allTournaments: TournamentResponse[];
  tournament: TournamentResponse | null;
  categories: CategoryResponse[] | null;
}

const SECTIONS = [
  { key: 'gironi', label: 'Gironi', icon: CalendarDays },
  { key: 'classifica', label: 'Classifica', icon: ListOrdered },
  { key: 'tabellone', label: 'Tabellone', icon: Network },
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

const navItemClass =
  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white';
const navItemActiveClass =
  'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-600 hover:to-fuchsia-600';

export default function PublicShell() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [allTournaments, setAllTournaments] = useState<TournamentResponse[] | null>(null);
  const [tournament, setTournament] = useState<TournamentResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<TournamentResponse[]>('/api/public/tournaments')
      .then((data) => {
        if (!cancelled) setAllTournaments(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!tournamentId) {
      setTournament(null);
      setCategories(null);
      return;
    }
    let cancelled = false;
    Promise.all([
      apiGet<TournamentResponse>(`/api/public/tournaments/${tournamentId}`),
      apiGet<CategoryResponse[]>(`/api/public/tournaments/${tournamentId}/categories`),
    ])
      .then(([t, cats]) => {
        if (cancelled) return;
        setTournament(t);
        setCategories(sortCategories(cats));
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  const section = currentSection(location.pathname);
  const categoryId = currentCategoryId(location.pathname, tournamentId, section);
  const dataReady = tournamentId ? tournament !== null && categories !== null : true;

  return (
    <div className="flex min-h-svh bg-muted/30">
      <aside className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto bg-slate-950 px-4 py-6 text-slate-100">
        <Link to="/" className="flex items-center gap-3 px-1">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Trophy className="size-5 text-white" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-heading truncate text-sm font-bold text-white">Olympus Tornei</span>
            <span className="text-xs text-slate-400">Gestionale tornei padel</span>
          </span>
        </Link>

        <nav className="flex flex-col gap-1">
          <span className="px-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Tornei</span>
          <Link
            to="/"
            className={cn(navItemClass, location.pathname === '/' && navItemActiveClass)}
          >
            <Home className="size-4" />
            Tutti i tornei
          </Link>
        </nav>

        {tournamentId && tournament && (
          <nav className="flex flex-col gap-1">
            <span className="truncate px-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              {tournament.name}
            </span>
            {allTournaments && allTournaments.length > 1 && (
              <div className="mb-1 px-1">
                <Select value={String(tournament.id)} onValueChange={(v) => navigate(`/tornei/${v}/${section}`)}>
                  <SelectTrigger className="w-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 [&_svg]:text-slate-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allTournaments.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  type="button"
                  className={cn(navItemClass, section === s.key && navItemActiveClass)}
                  onClick={() =>
                    navigate(
                      categoryId
                        ? `/tornei/${tournamentId}/${s.key}/${categoryId}`
                        : `/tornei/${tournamentId}/${s.key}`,
                    )
                  }
                >
                  <Icon className="size-4" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        )}
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          {error ? (
            <div className="py-12 text-center text-destructive">Errore nel caricamento: {error}</div>
          ) : !allTournaments || !dataReady ? (
            <div className="py-12 text-center text-muted-foreground">Caricamento...</div>
          ) : (
            <Outlet context={{ allTournaments, tournament, categories } satisfies PublicOutletContext} />
          )}
        </div>
      </main>
    </div>
  );
}
