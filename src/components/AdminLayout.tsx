import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Trophy, Users, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Button } from './ui/button';
import { sidebarNavItemActiveClass, sidebarNavItemClass } from '../lib/sidebarNav';
import { cn } from '@/lib/utils';
import logoOlympus from '@/assets/LogoOlympus.png';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tornei', icon: Trophy, end: true },
  { to: '/admin/utenti', label: 'Utenti', icon: Users, end: false },
] as const;

export default function AdminLayout() {
  const { token, username, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Chiude il menu mobile ogni volta che si naviga verso una nuova rotta.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="flex min-h-svh flex-col bg-slate-50 md:flex-row dark:bg-slate-900">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 md:hidden">
        <button
          type="button"
          aria-label="Apri il menu"
          className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-800/60"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" />
        </button>
        <span className="font-heading text-sm font-bold">Olympus Tornei</span>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 -translate-x-full flex-col gap-6 overflow-y-auto bg-slate-950 px-4 py-6 text-slate-100 transition-transform duration-200 md:sticky md:top-0 md:h-svh md:w-64 md:max-w-none md:translate-x-0',
          mobileOpen && 'translate-x-0',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 px-1">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <img src={logoOlympus} alt="" className="size-6" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="font-heading truncate text-sm font-bold text-white">Olympus Tornei</span>
              <span className="text-xs text-slate-400">Amministrazione</span>
            </span>
          </div>
          <button
            type="button"
            aria-label="Chiudi il menu"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-slate-800/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" />
          </button>
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
