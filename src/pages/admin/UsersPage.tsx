import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiPost } from '../../api/client';
import type { UserResponse } from '../../api/types';
import { adminErrorMessage } from '../../lib/adminError';
import { useAuth } from '../../auth/AuthContext';
import { GradientBorder } from '../../components/GradientBorder';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function UsersPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function onUnauthorized() {
    logout();
    navigate('/admin/login');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await apiPost<UserResponse>('/api/admin/users', { username, password }, token);
      toast.success(`Utente "${user.username}" creato correttamente.`);
      setUsername('');
      setPassword('');
    } catch (err) {
      toast.error(adminErrorMessage(err, onUnauthorized));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Utenti amministratori</h2>
      <p className="text-muted-foreground">
        Non esiste un elenco degli utenti esistenti (l'API espone solo la creazione): usa questo modulo per
        aggiungere un nuovo accesso amministratore.
      </p>

      <GradientBorder>
        <Card className="ring-0">
          <CardHeader>
            <CardTitle className="text-base">Nuovo amministratore</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col items-start gap-3" onSubmit={handleSubmit}>
              <div className="flex w-full max-w-90 flex-col gap-1.5">
                <Label htmlFor="new-username">Username</Label>
                <Input id="new-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="flex w-full max-w-90 flex-col gap-1.5">
                <Label htmlFor="new-password">Password (min. 8 caratteri)</Label>
                <Input
                  id="new-password"
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting}>
                Crea utente
              </Button>
            </form>
          </CardContent>
        </Card>
      </GradientBorder>
    </div>
  );
}
