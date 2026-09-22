import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../../api/client';
import type { UserResponse } from '../../api/types';
import { adminErrorMessage } from '../../lib/adminError';
import { useAuth } from '../../auth/AuthContext';

export default function UsersPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<UserResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function onUnauthorized() {
    logout();
    navigate('/admin/login');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    setSubmitting(true);
    try {
      const user = await apiPost<UserResponse>('/api/admin/users', { username, password }, token);
      setCreated(user);
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(adminErrorMessage(err, onUnauthorized));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-page">
      <h2>Utenti amministratori</h2>
      <p className="page-message">
        Non esiste un elenco degli utenti esistenti (l'API espone solo la creazione): usa questo modulo per
        aggiungere un nuovo accesso amministratore.
      </p>

      <section className="admin-card">
        <h3>Nuovo amministratore</h3>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            Password (min. 8 caratteri)
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          {created && <p className="form-success">Utente "{created.username}" creato correttamente.</p>}
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            Crea utente
          </button>
        </form>
      </section>
    </div>
  );
}
