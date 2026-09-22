import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

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
    <div className="app-shell">
      <header className="admin-header">
        <h1>Olympus Tornei — Amministrazione</h1>
        <nav className="admin-header__nav">
          <NavLink to="/admin" end>
            Tornei
          </NavLink>
          <NavLink to="/admin/utenti">Utenti</NavLink>
        </nav>
        <div className="admin-header__user">
          <span>{username}</span>
          <button type="button" className="btn btn--ghost" onClick={handleLogout}>
            Esci
          </button>
        </div>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
