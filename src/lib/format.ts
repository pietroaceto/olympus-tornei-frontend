import type { CategoryResponse, MatchResultType } from '../api/types';

export const CATEGORY_ORDER = ['GOLD', 'SILVER', 'BRONZE'] as const;

export function categoryLabel(name: string): string {
  switch (name) {
    case 'GOLD':
      return 'Gold';
    case 'SILVER':
      return 'Silver';
    case 'BRONZE':
      return 'Bronze';
    default:
      return name;
  }
}

export function sortCategories(categories: CategoryResponse[]): CategoryResponse[] {
  return [...categories].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.name as (typeof CATEGORY_ORDER)[number]) -
      CATEGORY_ORDER.indexOf(b.name as (typeof CATEGORY_ORDER)[number]),
  );
}

export function phaseLabel(phase: string): string {
  switch (phase) {
    case 'GIRONE':
      return 'Girone';
    case 'TABELLONE':
      return 'Tabellone';
    case 'CONCLUSA':
      return 'Conclusa';
    default:
      return phase;
  }
}

export function matchStatusLabel(status: string): string {
  return status === 'PLAYED' ? 'Giocata' : 'Da giocare';
}

export function resultTypeLabel(resultType: MatchResultType | null): string {
  switch (resultType) {
    case 'WIN_HOME':
      return 'Vittoria squadra di casa';
    case 'WIN_HOME_TB':
      return 'Vittoria squadra di casa al tie-break';
    case 'WIN_AWAY':
      return 'Vittoria squadra ospite';
    case 'WIN_AWAY_TB':
      return 'Vittoria squadra ospite al tie-break';
    default:
      return '';
  }
}

export function teamLabel(name: string | null): string {
  return name ?? 'Da definire';
}
