import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiDelete, apiGet, apiPost } from '../../api/client';
import type { TournamentRequest, TournamentResponse, TournamentStatus } from '../../api/types';
import { tournamentStatusLabel } from '../../lib/format';
import { adminErrorMessage } from '../../lib/adminError';
import { useAuth } from '../../auth/AuthContext';

export default function DashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<TournamentResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [season, setSeason] = useState('');
  const [status, setStatus] = useState<TournamentStatus>('DRAFT');
  const [submitting, setSubmitting] = useState(false);

  function onUnauthorized() {
    logout();
    navigate('/admin/login');
  }

  const loadTournaments = useCallback(() => {
    apiGet<TournamentResponse[]>('/api/public/tournaments')
      .then(setTournaments)
      .catch((err: unknown) => setError(adminErrorMessage(err, onUnauthorized)));
  }, []);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body: TournamentRequest = { name, season: season || null, status };
      await apiPost('/api/admin/tournaments', body, token);
      setName('');
      setSeason('');
      setStatus('DRAFT');
      setShowCreateForm(false);
      loadTournaments();
    } catch (err) {
      setError(adminErrorMessage(err, onUnauthorized));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Eliminare definitivamente questo torneo e tutte le sue categorie?')) return;
    try {
      await apiDelete(`/api/admin/tournaments/${id}`, token);
      loadTournaments();
    } catch (err) {
      setError(adminErrorMessage(err, onUnauthorized));
    }
  }

  const sortedTournaments = tournaments ? [...tournaments].sort((a, b) => b.id - a.id) : null;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h2>Tornei</h2>
        <button
          type="button"
          className="btn btn--primary btn--icon"
          aria-label="Nuovo torneo"
          onClick={() => setShowCreateForm((v) => !v)}
        >
          +
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}

      {showCreateForm && (
        <section className="admin-card">
          <h3>Nuovo torneo</h3>
          <form className="admin-form" onSubmit={handleCreate}>
            <label>
              Nome
              <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </label>
            <label>
              Stagione
              <input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="es. 2026" />
            </label>
            <label>
              Stato
              <select value={status} onChange={(e) => setStatus(e.target.value as TournamentStatus)}>
                <option value="DRAFT">Bozza</option>
                <option value="ACTIVE">In corso</option>
                <option value="COMPLETED">Concluso</option>
              </select>
            </label>
            <div className="admin-actions">
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                Crea torneo
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setShowCreateForm(false)}>
                Annulla
              </button>
            </div>
          </form>
        </section>
      )}

      {!sortedTournaments ? (
        <p className="page-message">Caricamento...</p>
      ) : sortedTournaments.length === 0 ? (
        <p className="page-message">Nessun torneo ancora creato.</p>
      ) : (
        <ul className="admin-list">
          {sortedTournaments.map((t) => (
            <li key={t.id} className="admin-list__row">
              <Link to={`/admin/tornei/${t.id}`} className="admin-list__title">
                {t.name}
              </Link>
              <span className="admin-list__meta">
                {t.season} · {tournamentStatusLabel(t.status)}
              </span>
              <button type="button" className="btn btn--danger" onClick={() => handleDelete(t.id)}>
                Elimina
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
