import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { apiDelete, apiGet, apiPost } from '../../api/client';
import type { TournamentRequest, TournamentResponse, TournamentStatus } from '../../api/types';
import { tournamentStatusLabel } from '../../lib/format';
import { adminErrorMessage } from '../../lib/adminError';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export default function DashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<TournamentResponse[] | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [season, setSeason] = useState('');
  const [status, setStatus] = useState<TournamentStatus>('DRAFT');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TournamentResponse | null>(null);

  function onUnauthorized() {
    logout();
    navigate('/admin/login');
  }

  const loadTournaments = useCallback(() => {
    apiGet<TournamentResponse[]>('/api/public/tournaments')
      .then(setTournaments)
      .catch((err: unknown) => toast.error(adminErrorMessage(err, onUnauthorized)));
  }, []);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: TournamentRequest = { name, season: season || null, status };
      await apiPost('/api/admin/tournaments', body, token);
      setName('');
      setSeason('');
      setStatus('DRAFT');
      setShowCreateForm(false);
      toast.success('Torneo creato.');
      loadTournaments();
    } catch (err) {
      toast.error(adminErrorMessage(err, onUnauthorized));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/admin/tournaments/${deleteTarget.id}`, token);
      toast.success('Torneo eliminato.');
      loadTournaments();
    } catch (err) {
      toast.error(adminErrorMessage(err, onUnauthorized));
    } finally {
      setDeleteTarget(null);
    }
  }

  const sortedTournaments = tournaments ? [...tournaments].sort((a, b) => b.id - a.id) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Tornei</h2>
        <Button
          type="button"
          size="icon"
          aria-label="Nuovo torneo"
          className="rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-600"
          onClick={() => setShowCreateForm((v) => !v)}
        >
          <Plus />
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuovo torneo</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col items-start gap-3" onSubmit={handleCreate}>
              <div className="flex w-full max-w-90 flex-col gap-1.5">
                <Label htmlFor="tournament-name">Nome</Label>
                <Input id="tournament-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </div>
              <div className="flex w-full max-w-90 flex-col gap-1.5">
                <Label htmlFor="tournament-season">Stagione</Label>
                <Input
                  id="tournament-season"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  placeholder="es. 2026"
                />
              </div>
              <div className="flex w-full max-w-90 flex-col gap-1.5">
                <Label>Stato</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TournamentStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Bozza</SelectItem>
                    <SelectItem value="ACTIVE">In corso</SelectItem>
                    <SelectItem value="COMPLETED">Concluso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  Crea torneo
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!sortedTournaments ? (
        <p className="text-muted-foreground">Caricamento...</p>
      ) : sortedTournaments.length === 0 ? (
        <p className="text-muted-foreground">Nessun torneo ancora creato.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sortedTournaments.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3">
              <Link to={`/admin/tornei/${t.id}`} className="font-semibold hover:underline">
                {t.name}
              </Link>
              <span className="mr-auto flex items-center gap-2 text-sm text-muted-foreground">
                {t.season}
                <Badge variant="secondary">{tournamentStatusLabel(t.status)}</Badge>
              </span>
              <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteTarget(t)}>
                Elimina
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminare il torneo?"
        description={`"${deleteTarget?.name}" e tutte le sue categorie verranno eliminati definitivamente.`}
        confirmLabel="Elimina"
        onConfirm={handleDelete}
      />
    </div>
  );
}
