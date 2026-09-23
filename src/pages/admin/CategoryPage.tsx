import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';
import type {
  BracketResponse,
  CategoryResponse,
  PlayerResponse,
  RoundResponse,
  TeamResponse,
} from '../../api/types';
import {
  categoryLabel,
  competitionFormatLabel,
  matchFormatLabel,
  matchStatusLabel,
  phaseLabel,
  teamLabel,
} from '../../lib/format';
import { adminErrorMessage } from '../../lib/adminError';
import { nextPowerOfTwo } from '../../lib/bracket';
import { useAuth } from '../../auth/AuthContext';
import Bracket from '../../components/Bracket';
import { GradientBorder } from '../../components/GradientBorder';
import { MatchResultForm } from '../../components/admin/MatchResultForm';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { cn } from '@/lib/utils';

function TeamCard({
  team,
  locked,
  token,
  onChanged,
  onUnauthorized,
}: {
  team: TeamResponse;
  locked: boolean;
  token: string | null;
  onChanged: () => void;
  onUnauthorized: () => void;
}) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(team.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function fail(err: unknown) {
    toast.error(adminErrorMessage(err, onUnauthorized));
  }

  async function handleRenameTeam(e: FormEvent) {
    e.preventDefault();
    try {
      await apiPut(`/api/admin/teams/${team.id}`, { name: nameDraft }, token);
      setEditingName(false);
      onChanged();
    } catch (err) {
      fail(err);
    }
  }

  async function handleDeleteTeam() {
    try {
      await apiDelete(`/api/admin/teams/${team.id}`, token);
      toast.success('Squadra eliminata.');
      onChanged();
    } catch (err) {
      fail(err);
    } finally {
      setConfirmDelete(false);
    }
  }

  async function handleAddPlayer(e: FormEvent) {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    try {
      await apiPost(`/api/admin/teams/${team.id}/players`, { name: newPlayerName.trim() }, token);
      setNewPlayerName('');
      onChanged();
    } catch (err) {
      fail(err);
    }
  }

  async function handleDeletePlayer(player: PlayerResponse) {
    try {
      await apiDelete(`/api/admin/players/${player.id}`, token);
      onChanged();
    } catch (err) {
      fail(err);
    }
  }

  return (
    <li>
      <GradientBorder className="h-full">
        <div className="h-full rounded-xl bg-card p-3 text-card-foreground">
          {editingName ? (
            <form className="mb-2 flex flex-wrap items-center gap-2" onSubmit={handleRenameTeam}>
              <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus className="h-8 w-auto" />
              <Button type="submit" size="sm">
                Salva
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditingName(false)}>
                Annulla
              </Button>
            </form>
          ) : (
            <div className="mb-2 flex items-center justify-between gap-2">
              <strong>{team.name}</strong>
              {!locked && (
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingName(true)}>
                    Rinomina
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
                    Elimina
                  </Button>
                </div>
              )}
            </div>
          )}

          <ul className="mb-2 flex flex-col gap-1">
            {team.players.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.name}</span>
                {!locked && (
                  <button
                    type="button"
                    className="text-xs font-medium text-destructive hover:underline"
                    onClick={() => handleDeletePlayer(p)}
                  >
                    rimuovi
                  </button>
                )}
              </li>
            ))}
          </ul>

          {!locked && (
            <form className="flex flex-wrap items-center gap-2" onSubmit={handleAddPlayer}>
              <Input
                placeholder="Nome giocatore"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="h-8 w-auto"
              />
              <Button type="submit" size="sm">
                Aggiungi
              </Button>
            </form>
          )}

          <ConfirmDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            title="Eliminare la squadra?"
            description={`"${team.name}" e la sua rosa verranno eliminati definitivamente.`}
            confirmLabel="Elimina"
            onConfirm={handleDeleteTeam}
          />
        </div>
      </GradientBorder>
    </li>
  );
}

function ManualBracketForm({
  teams,
  token,
  categoryId,
  onDone,
  onCancel,
  onUnauthorized,
}: {
  teams: TeamResponse[];
  token: string | null;
  categoryId: string | undefined;
  onDone: () => void;
  onCancel: () => void;
  onUnauthorized: () => void;
}) {
  const bracketSize = nextPowerOfTwo(teams.length);
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(bracketSize).fill(null));
  const [submitting, setSubmitting] = useState(false);

  function updateSlot(index: number, value: string) {
    const teamId = value === 'BYE' ? null : Number(value);
    setSlots((prev) => prev.map((v, i) => (i === index ? teamId : v)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost(`/api/admin/categories/${categoryId}/bracket/generate-manual`, { slots }, token);
      toast.success('Tabellone generato.');
      onDone();
    } catch (err) {
      toast.error(adminErrorMessage(err, onUnauthorized));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col items-start gap-3" onSubmit={handleSubmit}>
      <p className="text-sm text-muted-foreground">
        Assegna ogni squadra a uno slot del primo turno. Gli slot adiacenti (1-2, 3-4, ...) giocano tra loro; lascia
        "BYE" per far passare direttamente il turno senza giocare.
      </p>
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
        {slots.map((teamId, i) => {
          const usedElsewhere = new Set(slots.filter((_, j) => j !== i).filter((v): v is number => v !== null));
          const available = teams.filter((t) => t.id === teamId || !usedElsewhere.has(t.id));
          return (
            <div key={i} className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Slot {i + 1}</Label>
              <Select value={teamId === null ? 'BYE' : String(teamId)} onValueChange={(v) => updateSlot(i, v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BYE">BYE</SelectItem>
                  {available.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          Genera tabellone
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annulla
        </Button>
      </div>
    </form>
  );
}

export default function CategoryPage() {
  const { categoryId } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState<CategoryResponse | null>(null);
  const [teams, setTeams] = useState<TeamResponse[] | null>(null);
  const [rounds, setRounds] = useState<RoundResponse[] | null>(null);
  const [bracket, setBracket] = useState<BracketResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPlayers, setNewTeamPlayers] = useState('');
  const [qualifiedCount, setQualifiedCount] = useState(4);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmResetSchedule, setConfirmResetSchedule] = useState(false);
  const [confirmResetBracket, setConfirmResetBracket] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);

  function onUnauthorized() {
    logout();
    navigate('/admin/login');
  }

  const load = useCallback(() => {
    Promise.all([
      apiGet<CategoryResponse>(`/api/public/categories/${categoryId}`),
      apiGet<TeamResponse[]>(`/api/public/categories/${categoryId}/teams`),
      apiGet<RoundResponse[]>(`/api/public/categories/${categoryId}/schedule`),
      apiGet<BracketResponse>(`/api/public/categories/${categoryId}/bracket`),
    ])
      .then(([cat, t, r, b]) => {
        setCategory(cat);
        setTeams(t);
        setRounds(r);
        setBracket(b);
        setQualifiedCount((prev) => (prev > 1 ? prev : Math.min(4, t.length)));
      })
      .catch((err: unknown) => setLoadError(adminErrorMessage(err, onUnauthorized)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateTeam(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const players = newTeamPlayers
        .split(/[,\n]/)
        .map((p) => p.trim())
        .filter(Boolean);
      await apiPost(`/api/admin/categories/${categoryId}/teams`, { name: newTeamName, players }, token);
      setNewTeamName('');
      setNewTeamPlayers('');
      setShowAddTeamDialog(false);
      toast.success('Squadra aggiunta.');
      load();
    } catch (err) {
      toast.error(adminErrorMessage(err, onUnauthorized));
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateSchedule() {
    setBusy(true);
    try {
      await apiPost(`/api/admin/categories/${categoryId}/schedule/generate`, undefined, token);
      toast.success('Calendario generato.');
      load();
    } catch (err) {
      toast.error(adminErrorMessage(err, onUnauthorized));
    } finally {
      setBusy(false);
    }
  }

  async function handleResetSchedule() {
    setBusy(true);
    try {
      await apiPost(`/api/admin/categories/${categoryId}/schedule/reset`, undefined, token);
      toast.success('Girone azzerato.');
      load();
    } catch (err) {
      toast.error(adminErrorMessage(err, onUnauthorized));
    } finally {
      setBusy(false);
      setConfirmResetSchedule(false);
    }
  }

  async function handleGenerateBracket(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiPost(`/api/admin/categories/${categoryId}/bracket/generate`, { qualifiedCount }, token);
      toast.success('Tabellone generato.');
      load();
    } catch (err) {
      toast.error(adminErrorMessage(err, onUnauthorized));
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateRandomBracket() {
    setBusy(true);
    try {
      await apiPost(`/api/admin/categories/${categoryId}/bracket/generate-random`, undefined, token);
      setShowManualForm(false);
      toast.success('Tabellone generato.');
      load();
    } catch (err) {
      toast.error(adminErrorMessage(err, onUnauthorized));
    } finally {
      setBusy(false);
    }
  }

  async function handleResetBracket() {
    setBusy(true);
    try {
      await apiPost(`/api/admin/categories/${categoryId}/bracket/reset`, undefined, token);
      toast.success('Tabellone azzerato.');
      load();
    } catch (err) {
      toast.error(adminErrorMessage(err, onUnauthorized));
    } finally {
      setBusy(false);
      setConfirmResetBracket(false);
    }
  }

  if (!category || !teams || !rounds || !bracket) {
    return loadError ? (
      <div className="py-12 text-center text-destructive">Errore: {loadError}</div>
    ) : (
      <div className="py-12 text-center text-muted-foreground">Caricamento...</div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="link" className="h-auto self-start px-0" asChild>
        <Link to={`/admin/tornei/${category.tournamentId}`}>← Torneo</Link>
      </Button>
      <h2 className="text-xl font-semibold">{categoryLabel(category.name)}</h2>
      <p className="text-sm text-muted-foreground">
        {matchFormatLabel(category.matchFormat)}
        {category.matchFormat === 'MULTI' ? ` · ${category.subMatchesCount} sotto-partite` : ''} · Fase:{' '}
        {phaseLabel(category.phase)}
        {category.scheduleLocked ? ' · Rosa bloccata' : ''}
      </p>

      <GradientBorder>
        <Card className="ring-0">
          <CardHeader>
            <CardTitle className="text-base">Squadre</CardTitle>
            {!category.scheduleLocked && (
              <CardAction>
                <Button
                  type="button"
                  size="icon"
                  aria-label="Aggiungi squadra"
                  className="rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-600"
                  onClick={() => setShowAddTeamDialog(true)}
                >
                  <Plus />
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {teams.length === 0 ? (
              <p className="text-muted-foreground">Nessuna squadra ancora inserita.</p>
            ) : (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                {teams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    locked={category.scheduleLocked}
                    token={token}
                    onChanged={load}
                    onUnauthorized={onUnauthorized}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </GradientBorder>

      <Dialog open={showAddTeamDialog} onOpenChange={setShowAddTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova squadra</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-3" onSubmit={handleCreateTeam}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-team-name">Nome squadra</Label>
              <Input id="new-team-name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-team-players">Giocatori (separati da virgola)</Label>
              <Input
                id="new-team-players"
                value={newTeamPlayers}
                onChange={(e) => setNewTeamPlayers(e.target.value)}
                placeholder="Mario Rossi, Luca Bianchi"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                Aggiungi squadra
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {category.competitionFormat === 'GIRONE' && (
        <GradientBorder>
          <Card className="ring-0">
            <CardHeader>
              <CardTitle className="text-base">Girone</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={busy || category.scheduleLocked || teams.length < 2}
                  onClick={handleGenerateSchedule}
                >
                  {rounds.length > 0 ? 'Rigenera calendario' : 'Genera calendario'}
                </Button>
                {(rounds.length > 0 || category.scheduleLocked) && (
                  <Button type="button" variant="destructive" disabled={busy} onClick={() => setConfirmResetSchedule(true)}>
                    Reset girone
                  </Button>
                )}
              </div>
              {rounds.length === 0 ? (
                <p className="text-muted-foreground">Calendario non ancora generato.</p>
              ) : (
                <div className="flex flex-col gap-6">
                  {rounds.map((round) => (
                    <div key={round.roundNumber}>
                      <h4 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Giornata {round.roundNumber}
                      </h4>
                      <ul className="flex flex-col gap-2">
                        {round.matches.map((match) => (
                          <li key={match.id}>
                            <GradientBorder>
                              <button
                                type="button"
                                onClick={() => setEditingMatchId(match.id)}
                                className="grid w-full grid-cols-[1fr_auto_1fr_auto] items-center gap-2 rounded-xl bg-card px-4 py-3 text-left text-card-foreground"
                              >
                                <span
                                  className={cn(
                                    'truncate',
                                    match.winnerTeamId !== null && match.winnerTeamId === match.homeTeamId && 'font-bold text-primary',
                                  )}
                                >
                                  {teamLabel(match.homeTeamName)}
                                </span>
                                <span
                                  className={cn(
                                    'text-center text-sm',
                                    match.resultSummary ? 'font-semibold text-foreground' : 'text-muted-foreground',
                                  )}
                                >
                                  {match.resultSummary ?? 'vs'}
                                </span>
                                <span
                                  className={cn(
                                    'truncate',
                                    match.winnerTeamId !== null && match.winnerTeamId === match.awayTeamId && 'font-bold text-primary',
                                  )}
                                >
                                  {teamLabel(match.awayTeamName)}
                                </span>
                                <Badge variant={match.status === 'PLAYED' ? 'default' : 'outline'}>
                                  {matchStatusLabel(match.status)}
                                </Badge>
                              </button>
                            </GradientBorder>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </GradientBorder>
      )}

      <GradientBorder>
        <Card className="ring-0">
          <CardHeader>
            <CardTitle className="text-base">Tabellone</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{competitionFormatLabel(category.competitionFormat)}</p>
            {category.phase === 'GIRONE' && category.competitionFormat === 'GIRONE' && (
              <>
                <p className="text-muted-foreground">
                  Il tabellone viene generato automaticamente, con tutte le squadre, non appena l'ultimo risultato del
                  girone viene inserito. Puoi comunque generarlo subito qui sotto, se necessario.
                </p>
                <form className="flex flex-col items-start gap-3" onSubmit={handleGenerateBracket}>
                  <div className="flex w-full max-w-90 flex-col gap-1.5">
                    <Label htmlFor="qualified-count">Squadre qualificate</Label>
                    <Input
                      id="qualified-count"
                      type="number"
                      min={2}
                      max={teams.length}
                      value={qualifiedCount}
                      onChange={(e) => setQualifiedCount(Number(e.target.value))}
                    />
                  </div>
                  <Button type="submit" disabled={busy || teams.length < 2}>
                    Genera tabellone ora
                  </Button>
                </form>
              </>
            )}
            {category.phase === 'GIRONE' && category.competitionFormat === 'TABELLONE' && (
              showManualForm ? (
                <ManualBracketForm
                  teams={teams}
                  token={token}
                  categoryId={categoryId}
                  onDone={() => {
                    setShowManualForm(false);
                    load();
                  }}
                  onCancel={() => setShowManualForm(false)}
                  onUnauthorized={onUnauthorized}
                />
              ) : (
                <div className="flex gap-2">
                  <Button type="button" disabled={busy || teams.length < 2} onClick={handleGenerateRandomBracket}>
                    Genera casuale
                  </Button>
                  <Button type="button" variant="outline" disabled={teams.length < 2} onClick={() => setShowManualForm(true)}>
                    Inserisci accoppiamenti manualmente
                  </Button>
                </div>
              )
            )}
            {category.phase !== 'GIRONE' && bracket.totalRounds !== null && (
              <>
                <div className="flex gap-2">
                  <Button type="button" variant="destructive" disabled={busy} onClick={() => setConfirmResetBracket(true)}>
                    Reset tabellone
                  </Button>
                </div>
                <Bracket
                  rounds={bracket.rounds}
                  totalRounds={bracket.totalRounds}
                  onMatchClick={(matchId) => navigate(`/admin/partite/${matchId}`)}
                />
              </>
            )}
          </CardContent>
        </Card>
      </GradientBorder>

      <ConfirmDialog
        open={confirmResetSchedule}
        onOpenChange={setConfirmResetSchedule}
        title="Azzerare il girone?"
        description="Calendario e risultati del girone verranno cancellati e la categoria sarà sbloccata."
        confirmLabel="Azzera"
        onConfirm={handleResetSchedule}
      />
      <ConfirmDialog
        open={confirmResetBracket}
        onOpenChange={setConfirmResetBracket}
        title="Azzerare il tabellone?"
        description="Il tabellone verrà cancellato e la categoria tornerà alla fase girone."
        confirmLabel="Azzera"
        onConfirm={handleResetBracket}
      />

      <Dialog open={editingMatchId !== null} onOpenChange={(open) => !open && setEditingMatchId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Risultato partita</DialogTitle>
          </DialogHeader>
          {editingMatchId !== null && (
            <MatchResultForm
              matchId={editingMatchId}
              onUnauthorized={onUnauthorized}
              onSaved={() => {
                setEditingMatchId(null);
                load();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
