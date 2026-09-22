import { NavLink } from 'react-router-dom';
import type { CategoryResponse } from '../api/types';
import { categoryLabel } from '../lib/format';
import { cn } from '@/lib/utils';

export default function CategoryTabs({
  categories,
  basePath,
}: {
  categories: CategoryResponse[];
  basePath: string;
}) {
  return (
    <nav className="mb-5 flex flex-wrap gap-2">
      {categories.map((cat) => (
        <NavLink
          key={cat.id}
          to={`${basePath}/${cat.id}`}
          className={({ isActive }) =>
            cn(
              'inline-block rounded-full border px-5 py-2 font-semibold',
              isActive ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-foreground',
            )
          }
        >
          {categoryLabel(cat.name)}
        </NavLink>
      ))}
    </nav>
  );
}
