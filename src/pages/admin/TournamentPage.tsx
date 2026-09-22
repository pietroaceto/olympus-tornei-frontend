import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiDelete, apiGet, apiPost } from '../../api/client';
import type { CategoryName, CategoryRequest, CategoryResponse, MatchFormat, TournamentResponse } from '../../api/types';
import { categoryLabel, matchFormatLabel, phaseLabel, sortCategories, tournamentStatusLabel } from '../../lib/format';
import { adminErrorMessage } from '../../lib/adminError';
import { useAuth } from '../../auth/AuthContext';

export default function TournamentPage() {
  const { tournamentId } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<TournamentResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState<CategoryName>('GOLD');
  const [matchFormat, setMatchFormat] = useState<MatchFormat>('SINGLE');
  const [subMatchesCount, setSubMatchesCount] = useState(2);
  const [submitting, setSubmitting] = useState(false);

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
      .catch((err: unknown) => setError(adminErrorMessage(err, onUnauthorized)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateCategory(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body: CategoryRequest = {
        name,
        matchFormat,
        subMatchesCount: matchFormat === 'MULTI' ? subMatchesCount : null,
      };
      await apiPost(`/api/admin/tournaments/${tournamentId}/categories`, body, token);
      load();
    } catch (err) {
      setError(adminErrorMessage(err, onUnauthorized));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Eliminare questa categoria e tutti i suoi dati (squadre, calendario, risultati)?')) return;
    try {
      await apiDelete(`/api/admin/categories/${id}`, token);
      load();
    } catch (err) {
      setError(adminErrorMessage(err, onUnauthorized));
    }
  }

  if (error && !tournament) {
    return <div className="page-message page-message--error">Errore: {error}</div>;
  }
  if (!tournament || !categories) {
    return <div className="page-message">Caricamento...</div>;
  }

  const usedNames = new Set(categories.map((c) => c.name));
  const availableNames = (['GOLD', 'SILVER', 'BRONZE'] as CategoryName[]).filter((n) => !usedNames.has(n));

  return (
    <div className="admin-page">
      <Link to="/admin" className="link-button">
        ← Tutti i tornei
      </Link>
      <h2>
        {tournament.name} <span className="admin-page__meta">({tournamentStatusLabel(tournament.status)})</span>
      </h2>
      {error && <p className="form-error">{error}</p>}

      {categories.length === 0 ? (
        <p className="page-message">Nessuna categoria creata per questo torneo.</p>
      ) : (
        <ul className="admin-list">
          {categories.map((cat) => (
            <li key={cat.id} className="admin-list__row">
              <Link to={`/admin/categorie/${cat.id}`} className="admin-list__title">
                {categoryLabel(cat.name)}
              </Link>
              <span className="admin-list__meta">
                {matchFormatLabel(cat.matchFormat)} · {phaseLabel(cat.phase)}
              </span>
              <button
                type="button"
                className="btn btn--danger"
                disabled={cat.scheduleLocked}
                title={cat.scheduleLocked ? 'Categoria bloccata: già in corso' : undefined}
                onClick={() => handleDeleteCategory(cat.id)}
              >
                Elimina
              </button>
            </li>
          ))}
        </ul>
      )}

      {availableNames.length > 0 && (
        <section className="admin-card">
          <h3>Nuova categoria</h3>
          <form className="admin-form" onSubmit={handleCreateCategory}>
            <label>
              Categoria
              <select value={name} onChange={(e) => setName(e.target.value as CategoryName)}>
                {availableNames.map((n) => (
                  <option key={n} value={n}>
                    {categoryLabel(n)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Formato incontro
              <select value={matchFormat} onChange={(e) => setMatchFormat(e.target.value as MatchFormat)}>
                <option value="SINGLE">Partita singola (coppia fissa)</option>
                <option value="MULTI">A squadre (più sotto-partite)</option>
              </select>
            </label>
            {matchFormat === 'MULTI' && (
              <label>
                Numero sotto-partite
                <input
                  type="number"
                  min={1}
                  value={subMatchesCount}
                  onChange={(e) => setSubMatchesCount(Number(e.target.value))}
                />
              </label>
            )}
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              Crea categoria
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
