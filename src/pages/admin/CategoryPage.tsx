import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';
import type {
  BracketResponse,
  CategoryResponse,
  PlayerResponse,
  RoundResponse,
  TeamResponse,
} from '../../api/types';
import { categoryLabel, matchFormatLabel, matchStatusLabel, phaseLabel, teamLabel } from '../../lib/format';
import { adminErrorMessage } from '../../lib/adminError';
import { useAuth } from '../../auth/AuthContext';

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
  const [error, setError] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(team.name);

  function fail(err: unknown) {
    setError(adminErrorMessage(err, onUnauthorized));
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
    if (!confirm(`Eliminare la squadra "${team.name}"?`)) return;
    try {
      await apiDelete(`/api/admin/teams/${team.id}`, token);
      onChanged();
    } catch (err) {
      fail(err);
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
    <li className="team-card">
      {editingName ? (
        <form className="inline-form" onSubmit={handleRenameTeam}>
          <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus />
          <button type="submit" className="btn btn--small">
            Salva
          </button>
          <button type="button" className="btn btn--small btn--ghost" onClick={() => setEditingName(false)}>
            Annulla
          </button>
        </form>
      ) : (
        <div className="team-card__header">
          <strong>{team.name}</strong>
          {!locked && (
            <div className="team-card__actions">
              <button type="button" className="btn btn--small btn--ghost" onClick={() => setEditingName(true)}>
                Rinomina
              </button>
              <button type="button" className="btn btn--small btn--danger" onClick={handleDeleteTeam}>
                Elimina
              </button>
            </div>
          )}
        </div>
      )}

      <ul className="player-list">
        {team.players.map((p) => (
          <li key={p.id} className="player-list__row">
            <span>{p.name}</span>
            {!locked && (
              <button type="button" className="link-button link-button--danger" onClick={() => handleDeletePlayer(p)}>
                rimuovi
              </button>
            )}
          </li>
        ))}
      </ul>

      {!locked && (
        <form className="inline-form" onSubmit={handleAddPlayer}>
          <input
            placeholder="Nome giocatore"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
          />
          <button type="submit" className="btn btn--small">
            Aggiungi
          </button>
        </form>
      )}
      {error && <p className="form-error">{error}</p>}
    </li>
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
  const [error, setError] = useState<string | null>(null);

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPlayers, setNewTeamPlayers] = useState('');
  const [qualifiedCount, setQualifiedCount] = useState(4);
  const [busy, setBusy] = useState(false);

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
      .catch((err: unknown) => setError(adminErrorMessage(err, onUnauthorized)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateTeam(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const players = newTeamPlayers
        .split(/[,\n]/)
        .map((p) => p.trim())
        .filter(Boolean);
      await apiPost(`/api/admin/categories/${categoryId}/teams`, { name: newTeamName, players }, token);
      setNewTeamName('');
      setNewTeamPlayers('');
      load();
    } catch (err) {
      setError(adminErrorMessage(err, onUnauthorized));
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateSchedule() {
    setError(null);
    setBusy(true);
    try {
      await apiPost(`/api/admin/categories/${categoryId}/schedule/generate`, undefined, token);
      load();
    } catch (err) {
      setError(adminErrorMessage(err, onUnauthorized));
    } finally {
      setBusy(false);
    }
  }

  async function handleResetSchedule() {
    if (!confirm('Cancellare calendario e risultati del girone e sbloccare la categoria?')) return;
    setError(null);
    setBusy(true);
    try {
      await apiPost(`/api/admin/categories/${categoryId}/schedule/reset`, undefined, token);
      load();
    } catch (err) {
      setError(adminErrorMessage(err, onUnauthorized));
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateBracket(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiPost(`/api/admin/categories/${categoryId}/bracket/generate`, { qualifiedCount }, token);
      load();
    } catch (err) {
      setError(adminErrorMessage(err, onUnauthorized));
    } finally {
      setBusy(false);
    }
  }

  async function handleResetBracket() {
    if (!confirm('Cancellare il tabellone e tornare alla fase girone?')) return;
    setError(null);
    setBusy(true);
    try {
      await apiPost(`/api/admin/categories/${categoryId}/bracket/reset`, undefined, token);
      load();
    } catch (err) {
      setError(adminErrorMessage(err, onUnauthorized));
    } finally {
      setBusy(false);
    }
  }

  if (!category || !teams || !rounds || !bracket) {
    return error ? (
      <div className="page-message page-message--error">Errore: {error}</div>
    ) : (
      <div className="page-message">Caricamento...</div>
    );
  }

  return (
    <div className="admin-page">
      <Link to={`/admin/tornei/${category.tournamentId}`} className="link-button">
        ← Torneo
      </Link>
      <h2>{categoryLabel(category.name)}</h2>
      <p className="admin-page__meta">
        {matchFormatLabel(category.matchFormat)}
        {category.matchFormat === 'MULTI' ? ` · ${category.subMatchesCount} sotto-partite` : ''} · Fase:{' '}
        {phaseLabel(category.phase)}
        {category.scheduleLocked ? ' · Rosa bloccata' : ''}
      </p>
      {error && <p className="form-error">{error}</p>}

      <section className="admin-card">
        <h3>Squadre</h3>
        {teams.length === 0 ? (
          <p className="page-message">Nessuna squadra ancora inserita.</p>
        ) : (
          <ul className="team-list">
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

        {!category.scheduleLocked && (
          <form className="admin-form" onSubmit={handleCreateTeam}>
            <label>
              Nome squadra
              <input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required />
            </label>
            <label>
              Giocatori (separati da virgola)
              <input
                value={newTeamPlayers}
                onChange={(e) => setNewTeamPlayers(e.target.value)}
                placeholder="Mario Rossi, Luca Bianchi"
              />
            </label>
            <button type="submit" className="btn btn--primary" disabled={busy}>
              Aggiungi squadra
            </button>
          </form>
        )}
      </section>

      <section className="admin-card">
        <h3>Girone</h3>
        <div className="admin-actions">
          <button type="button" className="btn" disabled={busy || category.scheduleLocked || teams.length < 2} onClick={handleGenerateSchedule}>
            {rounds.length > 0 ? 'Rigenera calendario' : 'Genera calendario'}
          </button>
          {(rounds.length > 0 || category.scheduleLocked) && (
            <button type="button" className="btn btn--danger" disabled={busy} onClick={handleResetSchedule}>
              Reset girone
            </button>
          )}
        </div>
        {rounds.length === 0 ? (
          <p className="page-message">Calendario non ancora generato.</p>
        ) : (
          <div className="rounds">
            {rounds.map((round) => (
              <div key={round.roundNumber} className="round-card">
                <h4>Giornata {round.roundNumber}</h4>
                <ul className="match-list">
                  {round.matches.map((match) => (
                    <li key={match.id} className="match-row">
                      <Link to={`/admin/partite/${match.id}`} className="match-row__button">
                        <span className="match-row__team">{teamLabel(match.homeTeamName)}</span>
                        <span className="match-row__vs">vs</span>
                        <span className="match-row__team">{teamLabel(match.awayTeamName)}</span>
                        <span className={`match-row__status match-row__status--${match.status.toLowerCase()}`}>
                          {matchStatusLabel(match.status)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-card">
        <h3>Tabellone</h3>
        {category.phase === 'GIRONE' ? (
          <form className="admin-form" onSubmit={handleGenerateBracket}>
            <label>
              Squadre qualificate
              <input
                type="number"
                min={2}
                max={teams.length}
                value={qualifiedCount}
                onChange={(e) => setQualifiedCount(Number(e.target.value))}
              />
            </label>
            <button type="submit" className="btn btn--primary" disabled={busy || teams.length < 2}>
              Genera tabellone
            </button>
          </form>
        ) : (
          <>
            <div className="admin-actions">
              <button type="button" className="btn btn--danger" disabled={busy} onClick={handleResetBracket}>
                Reset tabellone
              </button>
            </div>
            <div className="bracket">
              {bracket.rounds.map((round) => (
                <div key={round.roundIndex} className="bracket-round">
                  <h4>Turno {round.roundIndex + 1}</h4>
                  <ul className="match-list">
                    {round.matches.map((match) => (
                      <li key={match.matchId} className="match-row">
                        <Link to={`/admin/partite/${match.matchId}`} className="match-row__button">
                          <span className="match-row__team">{teamLabel(match.homeTeamName)}</span>
                          <span className="match-row__vs">vs</span>
                          <span className="match-row__team">{teamLabel(match.awayTeamName)}</span>
                          <span className={`match-row__status match-row__status--${match.status.toLowerCase()}`}>
                            {matchStatusLabel(match.status)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
