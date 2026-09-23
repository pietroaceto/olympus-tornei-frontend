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
              'inline-block rounded-full p-[1.5px] transition-colors',
              isActive ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' : 'bg-border',
            )
          }
        >
          {({ isActive }) => (
            <span
              className={cn(
                'block rounded-full bg-background px-5 py-2 font-semibold text-foreground transition-colors',
                !isActive && 'hover:bg-muted',
              )}
            >
              {categoryLabel(cat.name)}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
