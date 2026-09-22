import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CategoryLayout from './components/CategoryLayout';
import HomeRedirect from './components/HomeRedirect';
import SchedulePage from './pages/SchedulePage';
import StandingsPage from './pages/StandingsPage';
import BracketPage from './pages/BracketPage';
import MatchDetailPage from './pages/MatchDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/t/:tournamentId/c/:categoryId" element={<CategoryLayout />}>
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="standings" element={<StandingsPage />} />
          <Route path="bracket" element={<BracketPage />} />
          <Route path="match/:matchId" element={<MatchDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
