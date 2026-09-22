import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './auth/AuthContext';
import TournamentShell from './components/TournamentShell';
import AdminLayout from './components/AdminLayout';
import TournamentListPage from './pages/TournamentListPage';
import SchedulePage from './pages/SchedulePage';
import StandingsPage from './pages/StandingsPage';
import BracketPage from './pages/BracketPage';
import MatchDetailPage from './pages/MatchDetailPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import TournamentPage from './pages/admin/TournamentPage';
import CategoryPage from './pages/admin/CategoryPage';
import MatchResultPage from './pages/admin/MatchResultPage';
import UsersPage from './pages/admin/UsersPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<TournamentListPage />} />
          <Route path="/tornei/:tournamentId" element={<TournamentShell />}>
            <Route path="gironi" element={<SchedulePage />} />
            <Route path="gironi/:categoryId" element={<SchedulePage />} />
            <Route path="classifica" element={<StandingsPage />} />
            <Route path="classifica/:categoryId" element={<StandingsPage />} />
            <Route path="tabellone" element={<BracketPage />} />
            <Route path="tabellone/:categoryId" element={<BracketPage />} />
            <Route path="partita/:matchId" element={<MatchDetailPage />} />
          </Route>

          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="tornei/:tournamentId" element={<TournamentPage />} />
            <Route path="categorie/:categoryId" element={<CategoryPage />} />
            <Route path="partite/:matchId" element={<MatchResultPage />} />
            <Route path="utenti" element={<UsersPage />} />
          </Route>
        </Routes>
        <Toaster position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  );
}
