import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, Outlet } from 'react-router-dom';
import { CalendarDays, Home, ListOrdered, Menu, Network, Trophy, X } from 'lucide-react';
import { apiGet } from '../api/client';
import type { CategoryResponse, TournamentResponse } from '../api/types';
import { sortCategories } from '../lib/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { sidebarNavItemActiveClass, sidebarNavItemClass } from '../lib/sidebarNav';
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

export default function PublicShell() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [allTournaments, setAllTournaments] = useState<TournamentResponse[] | null>(null);
  const [tournament, setTournament] = useState<TournamentResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Chiude il menu mobile ogni volta che si naviga verso una nuova rotta.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const section = currentSection(location.pathname);
  const categoryId = currentCategoryId(location.pathname, tournamentId, section);
  const dataReady = tournamentId ? tournament !== null && categories !== null : true;

  return (
    <div className="flex min-h-svh flex-col bg-slate-50 md:flex-row dark:bg-slate-900">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 md:hidden">
        <button
          type="button"
          aria-label="Apri il menu"
          className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-800/60"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" />
        </button>
        <span className="font-heading text-sm font-bold">Olympus Tornei</span>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 -translate-x-full flex-col gap-6 overflow-y-auto bg-slate-950 px-4 py-6 text-slate-100 transition-transform duration-200 md:sticky md:top-0 md:h-svh md:w-64 md:max-w-none md:translate-x-0',
          mobileOpen && 'translate-x-0',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-3 px-1">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Trophy className="size-5 text-white" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="font-heading truncate text-sm font-bold text-white">Olympus Tornei</span>
              <span className="text-xs text-slate-400">Gestionale tornei padel</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Chiudi il menu"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-slate-800/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          <span className="px-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Tornei</span>
          <Link
            to="/"
            className={cn(sidebarNavItemClass, location.pathname === '/' && sidebarNavItemActiveClass)}
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
                  className={cn(sidebarNavItemClass, section === s.key && sidebarNavItemActiveClass)}
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
