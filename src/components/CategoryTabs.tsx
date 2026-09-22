import { NavLink } from 'react-router-dom';
import type { CategoryResponse } from '../api/types';
import { categoryLabel } from '../lib/format';

export default function CategoryTabs({
  categories,
  basePath,
}: {
  categories: CategoryResponse[];
  basePath: string;
}) {
  return (
    <nav className="category-tabs">
      {categories.map((cat) => (
        <NavLink
          key={cat.id}
          to={`${basePath}/${cat.id}`}
          className={({ isActive }) => `category-tabs__tab${isActive ? ' category-tabs__tab--active' : ''}`}
        >
          {categoryLabel(cat.name)}
        </NavLink>
      ))}
    </nav>
  );
}
