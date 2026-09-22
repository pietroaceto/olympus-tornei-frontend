import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Trophy, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Button } from './ui/button';
import { sidebarNavItemActiveClass, sidebarNavItemClass } from '../lib/sidebarNav';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tornei', icon: Trophy, end: true },
  { to: '/admin/utenti', label: 'Utenti', icon: Users, end: false },
] as const;

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
    <div className="flex min-h-svh bg-slate-50 dark:bg-slate-900">
      <aside className="flex w-64 shrink-0 flex-col gap-6 bg-slate-950 px-4 py-6 text-slate-100">
        <div className="flex items-center gap-3 px-1">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Trophy className="size-5 text-white" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-heading truncate text-sm font-bold text-white">Olympus Tornei</span>
            <span className="text-xs text-slate-400">Amministrazione</span>
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          <span className="px-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Gestione</span>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(sidebarNavItemClass, isActive && sidebarNavItemActiveClass)}
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-slate-800 pt-4">
          <span className="truncate px-2.5 text-sm text-slate-300">{username}</span>
          <Button
            type="button"
            variant="ghost"
            className="justify-start gap-2.5 text-slate-300 hover:bg-slate-800/60 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Esci
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
