import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import CategoryLayout from './components/CategoryLayout';
import AdminLayout from './components/AdminLayout';
import HomeRedirect from './components/HomeRedirect';
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
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/t/:tournamentId/c/:categoryId" element={<CategoryLayout />}>
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="standings" element={<StandingsPage />} />
            <Route path="bracket" element={<BracketPage />} />
            <Route path="match/:matchId" element={<MatchDetailPage />} />
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
      </AuthProvider>
    </BrowserRouter>
  );
}
