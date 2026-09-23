import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { apiDelete, apiGet, apiPost } from '../../api/client';
import type {
  CategoryName,
  CategoryRequest,
  CategoryResponse,
  CompetitionFormat,
  MatchFormat,
  TournamentResponse,
} from '../../api/types';
import {
  categoryLabel,
  competitionFormatLabel,
  matchFormatLabel,
  phaseLabel,
  sortCategories,
  tournamentStatusLabel,
} from '../../lib/format';
import { adminErrorMessage } from '../../lib/adminError';
import { useAuth } from '../../auth/AuthContext';
import { GradientBorder } from '../../components/GradientBorder';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export default function TournamentPage() {
  const { tournamentId } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<TournamentResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState<CategoryName>('GOLD');
  const [matchFormat, setMatchFormat] = useState<MatchFormat>('SINGLE');
  const [subMatchesCount, setSubMatchesCount] = useState(2);
  const [competitionFormat, setCompetitionFormat] = useState<CompetitionFormat>('GIRONE');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryResponse | null>(null);

  function onUnauthorized() {
    logout();
    navigate('/admin/login');
  }

  const load = useCallback(() => {
    Promise.all([
      apiGet<TournamentResponse>(`/api/public/tournaments/${tournamentId}`),
      apiGet<CategoryResponse[]>(`/api/public/tournaments/${tournamentId}/categories`),
    ])
      .then(([t, cats]) => {
        setTournament(t);
        setCategories(sortCategories(cats));
      })
      .catch((err: unknown) => setLoadError(adminErrorMessage(err, onUnauthorized)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateCategory(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: CategoryRequest = {
        name,
        matchFormat,
        subMatchesCount: matchFormat === 'MULTI' ? subMatchesCount : null,
        competitionFormat,
      };
      await apiPost(`/api/admin/tournaments/${tournamentId}/categories`, body, token);
      toast.success('Categoria creata.');
      load();
    } catch (err) {
      toast.error(adminErrorMessage(err, onUnauthorized));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCategory() {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/admin/categories/${deleteTarget.id}`, token);
      toast.success('Categoria eliminata.');
      load();
    } catch (err) {
      toast.error(adminErrorMessage(err, onUnauthorized));
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loadError && !tournament) {
    return <div className="py-12 text-center text-destructive">Errore: {loadError}</div>;
  }
  if (!tournament || !categories) {
    return <div className="py-12 text-center text-muted-foreground">Caricamento...</div>;
  }

  const usedNames = new Set(categories.map((c) => c.name));
  const availableNames = (['GOLD', 'SILVER', 'BRONZE'] as CategoryName[]).filter((n) => !usedNames.has(n));

  return (
    <div className="flex flex-col gap-4">
      <Button variant="link" className="h-auto self-start px-0" asChild>
        <Link to="/admin">← Tutti i tornei</Link>
      </Button>
      <h2 className="text-xl font-semibold">
        {tournament.name}{' '}
        <span className="text-sm font-normal text-muted-foreground">
          ({tournamentStatusLabel(tournament.status)})
        </span>
      </h2>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">Nessuna categoria creata per questo torneo.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((cat) => (
            <li key={cat.id} className="flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3">
              <Link to={`/admin/categorie/${cat.id}`} className="font-semibold hover:underline">
                {categoryLabel(cat.name)}
              </Link>
              <span className="mr-auto text-sm text-muted-foreground">
                {competitionFormatLabel(cat.competitionFormat)} · {matchFormatLabel(cat.matchFormat)} ·{' '}
                {phaseLabel(cat.phase)}
              </span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={cat.scheduleLocked}
                title={cat.scheduleLocked ? 'Categoria bloccata: già in corso' : undefined}
                onClick={() => setDeleteTarget(cat)}
              >
                Elimina
              </Button>
            </li>
          ))}
        </ul>
      )}

      {availableNames.length > 0 && (
        <GradientBorder>
          <Card className="ring-0">
            <CardHeader>
              <CardTitle className="text-base">Nuova categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col items-start gap-3" onSubmit={handleCreateCategory}>
                <div className="flex w-full max-w-90 flex-col gap-1.5">
                  <Label>Categoria</Label>
                  <Select value={name} onValueChange={(v) => setName(v as CategoryName)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableNames.map((n) => (
                        <SelectItem key={n} value={n}>
                          {categoryLabel(n)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-full max-w-90 flex-col gap-1.5">
                  <Label>Formato competizione</Label>
                  <Select value={competitionFormat} onValueChange={(v) => setCompetitionFormat(v as CompetitionFormat)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GIRONE">Girone (tabellone finale automatico)</SelectItem>
                      <SelectItem value="TABELLONE">Tabellone diretto (nessun girone)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-full max-w-90 flex-col gap-1.5">
                  <Label>Formato incontro</Label>
                  <Select value={matchFormat} onValueChange={(v) => setMatchFormat(v as MatchFormat)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Partita singola (coppia fissa)</SelectItem>
                      <SelectItem value="MULTI">A squadre (più sotto-partite)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {matchFormat === 'MULTI' && (
                  <div className="flex w-full max-w-90 flex-col gap-1.5">
                    <Label htmlFor="sub-matches-count">Numero sotto-partite</Label>
                    <Input
                      id="sub-matches-count"
                      type="number"
                      min={1}
                      value={subMatchesCount}
                      onChange={(e) => setSubMatchesCount(Number(e.target.value))}
                    />
                  </div>
                )}
                <Button type="submit" disabled={submitting}>
                  Crea categoria
                </Button>
              </form>
            </CardContent>
          </Card>
        </GradientBorder>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminare la categoria?"
        description={`"${deleteTarget ? categoryLabel(deleteTarget.name) : ''}" e tutti i suoi dati (squadre, calendario, risultati) verranno eliminati definitivamente.`}
        confirmLabel="Elimina"
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
}
