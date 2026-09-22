import type { CategoryResponse } from '../api/types';
import { sortCategories } from './format';

export interface ActiveCategorySelection {
  activeCategory: CategoryResponse | null;
  redirectToId: number | null;
}

/**
 * Risolve la categoria attiva data l'eventuale :categoryId nell'URL. Se
 * l'id non è presente o non corrisponde a nessuna categoria del torneo,
 * indica a chi chiama di reindirizzare alla prima categoria (Gold/Silver/
 * Bronze in quest'ordine), così ogni sezione (Gironi/Classifica/Tabellone)
 * ha sempre una categoria selezionata di default.
 */
export function resolveActiveCategory(
  categories: CategoryResponse[],
  categoryId: string | undefined,
): ActiveCategorySelection {
  const sorted = sortCategories(categories);
  if (sorted.length === 0) {
    return { activeCategory: null, redirectToId: null };
  }
  const found = categoryId ? sorted.find((c) => String(c.id) === categoryId) : undefined;
  if (found) {
    return { activeCategory: found, redirectToId: null };
  }
  return { activeCategory: null, redirectToId: sorted[0].id };
}
