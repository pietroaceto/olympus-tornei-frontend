import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { CategoryResponse, TournamentResponse } from '../api/types';
import { sortCategories, tournamentStatusLabel } from '../lib/format';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

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
    return <div className="py-12 text-center text-destructive">Errore nel caricamento: {error}</div>;
  }
  if (!tournament || !allTournaments || !categories) {
    return <div className="py-12 text-center text-muted-foreground">Caricamento...</div>;
  }

  const section = currentSection(location.pathname);
  const categoryId = currentCategoryId(location.pathname, tournamentId, section);

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col">
      <header className="flex flex-wrap items-center gap-5 border-b px-4 py-5">
        <Link to="/" className="font-heading text-lg font-bold whitespace-nowrap">
          Olympus Tornei
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Select
            value={String(tournament.id)}
            onValueChange={(value) => navigate(`/tornei/${value}/${section}`)}
          >
            <SelectTrigger className="max-w-70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allTournaments.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                  {t.season ? ` (${t.season})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary">{tournamentStatusLabel(tournament.status)}</Badge>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:flex-row">
        <nav className="flex gap-2 overflow-x-auto sm:w-40 sm:shrink-0 sm:flex-col sm:gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={cn(
                'shrink-0 rounded-lg px-3.5 py-2.5 text-left font-medium whitespace-nowrap text-muted-foreground hover:bg-muted',
                section === s.key && 'bg-primary/10 font-semibold text-primary hover:bg-primary/10',
              )}
              onClick={() =>
                navigate(categoryId ? `/tornei/${tournamentId}/${s.key}/${categoryId}` : `/tornei/${tournamentId}/${s.key}`)
              }
            >
              {s.label}
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          <Outlet context={{ tournament, categories } satisfies TournamentOutletContext} />
        </main>
      </div>
    </div>
  );
}
