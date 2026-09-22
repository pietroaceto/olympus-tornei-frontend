import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export default function AdminLayout() {
  const { token, username, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col px-4 pb-10">
      <header className="flex flex-wrap items-center gap-6 border-b py-4">
        <h1 className="text-lg font-semibold whitespace-nowrap">Olympus Tornei — Amministrazione</h1>
        <nav className="flex gap-4">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              cn('font-medium text-muted-foreground', isActive && 'text-primary')
            }
          >
            Tornei
          </NavLink>
          <NavLink
            to="/admin/utenti"
            className={({ isActive }) =>
              cn('font-medium text-muted-foreground', isActive && 'text-primary')
            }
          >
            Utenti
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-muted-foreground">
          <span>{username}</span>
          <Button type="button" variant="ghost" onClick={handleLogout}>
            Esci
          </Button>
        </div>
      </header>
      <main className="flex-1 pt-6">
        <Outlet />
      </main>
    </div>
  );
}
