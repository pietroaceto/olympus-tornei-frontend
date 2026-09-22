import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Layers, Search } from 'lucide-react';
import { apiGet } from '../api/client';
import type { CategoryResponse, TournamentStatus } from '../api/types';
import { tournamentStatusLabel } from '../lib/format';
import type { PublicOutletContext } from '../components/PublicShell';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';

const STATUS_BADGE_CLASS: Record<TournamentStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  COMPLETED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

export default function TournamentListPage() {
  const { allTournaments } = useOutletContext<PublicOutletContext>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | 'ALL'>('ALL');
  const [categoryCounts, setCategoryCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      allTournaments.map((t) =>
        apiGet<CategoryResponse[]>(`/api/public/tournaments/${t.id}/categories`).then(
          (cats) => [t.id, cats.length] as const,
        ),
      ),
    ).then((entries) => {
      if (cancelled) return;
      setCategoryCounts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [allTournaments]);

  const filtered = useMemo(() => {
    return allTournaments.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allTournaments, search, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Tutti i tornei</h1>
        <p className="text-muted-foreground">{allTournaments.length} tornei totali</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TournamentStatus | 'ALL')}>
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tutti gli stati</SelectItem>
            <SelectItem value="DRAFT">Bozza</SelectItem>
            <SelectItem value="ACTIVE">In corso</SelectItem>
            <SelectItem value="COMPLETED">Concluso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Nessun torneo trovato.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Card key={t.id} className="justify-between gap-3">
              <CardHeader className="gap-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{t.name}</h3>
                  <Badge className={STATUS_BADGE_CLASS[t.status]}>{tournamentStatusLabel(t.status)}</Badge>
                </div>
                {t.season && <p className="text-sm text-muted-foreground">{t.season}</p>}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Layers className="size-4" />
                  {categoryCounts[t.id] ?? '…'} categorie
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-600">
                  <Link to={`/tornei/${t.id}/gironi`}>Vedi torneo</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
