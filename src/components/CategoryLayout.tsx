import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { CategoryResponse, TournamentResponse } from '../api/types';
import { categoryLabel, phaseLabel, sortCategories } from '../lib/format';

export interface CategoryOutletContext {
  tournament: TournamentResponse;
  category: CategoryResponse;
}

export default function CategoryLayout() {
  const { tournamentId, categoryId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<TournamentResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([
      apiGet<TournamentResponse>(`/api/public/tournaments/${tournamentId}`),
      apiGet<CategoryResponse[]>(`/api/public/tournaments/${tournamentId}/categories`),
    ])
      .then(([t, cats]) => {
        if (cancelled) return;
        setTournament(t);
        setCategories(sortCategories(cats));
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  if (error) {
    return <div className="page-message page-message--error">Errore nel caricamento: {error}</div>;
  }
  if (!tournament || !categories) {
    return <div className="page-message">Caricamento...</div>;
  }

  const activeCategory = categories.find((c) => String(c.id) === categoryId) ?? categories[0];

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>{tournament.name}</h1>
        <p className="app-header__season">{tournament.season}</p>
        <nav className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-tabs__tab${cat.id === activeCategory.id ? ' category-tabs__tab--active' : ''}`}
              onClick={() => navigate(`/t/${tournamentId}/c/${cat.id}/schedule`)}
            >
              {categoryLabel(cat.name)}
            </button>
          ))}
        </nav>
      </header>

      <nav className="sub-tabs">
        <NavLink
          to={`/t/${tournamentId}/c/${activeCategory.id}/schedule`}
          className={({ isActive }) => `sub-tabs__tab${isActive ? ' sub-tabs__tab--active' : ''}`}
        >
          Giornate
        </NavLink>
        <NavLink
          to={`/t/${tournamentId}/c/${activeCategory.id}/standings`}
          className={({ isActive }) => `sub-tabs__tab${isActive ? ' sub-tabs__tab--active' : ''}`}
        >
          Classifica
        </NavLink>
        <NavLink
          to={`/t/${tournamentId}/c/${activeCategory.id}/bracket`}
          className={({ isActive }) => `sub-tabs__tab${isActive ? ' sub-tabs__tab--active' : ''}`}
        >
          Tabellone
        </NavLink>
        <span className="sub-tabs__phase">Fase: {phaseLabel(activeCategory.phase)}</span>
      </nav>

      <main className="app-content">
        <Outlet context={{ tournament, category: activeCategory } satisfies CategoryOutletContext} />
      </main>
    </div>
  );
}
