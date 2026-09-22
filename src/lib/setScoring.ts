import type { MatchResultType, SetScoreRequest } from '../api/types';

export const MAX_SETS = 3;

export function emptySets(): SetScoreRequest[] {
  return [1, 2, 3].map((setNumber) => ({ setNumber, homeGames: 0, awayGames: 0 }));
}

/** Riempie fino a MAX_SETS slot con i set esistenti (per precompilare un match già giocato). */
export function padSets(existing: SetScoreRequest[]): SetScoreRequest[] {
  const base = emptySets();
  existing.slice(0, MAX_SETS).forEach((s, i) => {
    base[i] = { setNumber: i + 1, homeGames: s.homeGames, awayGames: s.awayGames };
  });
  return base;
}

function isEmptySet(set: SetScoreRequest): boolean {
  return set.homeGames === 0 && set.awayGames === 0;
}

/** I set "usati" sono quelli non lasciati a 0-0: mettere un set a 0-0 lo elimina. */
export function activeSets(sets: SetScoreRequest[]): SetScoreRequest[] {
  return sets.filter((s) => !isEmptySet(s));
}

/**
 * Un set normale si vince a 6 con 2 game di scarto (6-0..6-4); se si arriva
 * a 5 pari si continua ma sempre con 2 di scarto (7-5); un punteggio di 7-6
 * significa che il set è stato deciso al tie-break.
 */
export function isValidSetScore(homeGames: number, awayGames: number): boolean {
  const winner = Math.max(homeGames, awayGames);
  const loser = Math.min(homeGames, awayGames);
  if (winner === 6) return loser <= 4;
  if (winner === 7) return loser === 5 || loser === 6;
  return false;
}

/**
 * Il Long Tie-Break (giocato solo se i due set sono 1-1, al posto di un
 * terzo set) si vince a 10 con 2 punti di scarto; sul 9 pari si continua a
 * oltranza finché una squadra non ha 2 punti di vantaggio.
 */
export function isValidLongTiebreakScore(homeGames: number, awayGames: number): boolean {
  const winner = Math.max(homeGames, awayGames);
  const loser = Math.min(homeGames, awayGames);
  if (winner < 10) return false;
  if (winner === 10) return loser <= 8;
  return winner - loser === 2;
}

function winnerOf(set: SetScoreRequest): 'HOME' | 'AWAY' {
  return set.homeGames > set.awayGames ? 'HOME' : 'AWAY';
}

export interface DeterminedResult {
  resultType: MatchResultType | null;
  /** Messaggio da mostrare se il risultato non è (ancora) determinabile. */
  error: string | null;
  /** I set effettivamente rilevanti per l'esito (da inviare al server, rinumerati). */
  usedSets: SetScoreRequest[];
}

/**
 * Determina automaticamente l'esito di un incontro (coppia fissa, formato
 * SINGLE) dai punteggi dei set: 2 set vinti dalla stessa squadra = vittoria
 * normale (3 punti); 1 set a testa = si guarda il terzo set come Long
 * Tie-Break, che decide l'incontro assegnando 2 punti anziché 3.
 */
export function determineSingleResult(sets: SetScoreRequest[]): DeterminedResult {
  const active = activeSets(sets);
  const [set1, set2, set3] = active;

  if (!set1 || !set2) {
    return { resultType: null, error: 'Inserisci il punteggio dei primi due set.', usedSets: active };
  }
  if (!isValidSetScore(set1.homeGames, set1.awayGames)) {
    return { resultType: null, error: 'Il punteggio del set 1 non è valido.', usedSets: active };
  }
  if (!isValidSetScore(set2.homeGames, set2.awayGames)) {
    return { resultType: null, error: 'Il punteggio del set 2 non è valido.', usedSets: active };
  }

  const winner1 = winnerOf(set1);
  const winner2 = winnerOf(set2);

  if (winner1 === winner2) {
    return {
      resultType: winner1 === 'HOME' ? 'WIN_HOME' : 'WIN_AWAY',
      error: null,
      usedSets: [set1, set2],
    };
  }

  if (!set3) {
    return {
      resultType: null,
      error: 'Set in parità 1-1: inserisci il risultato del Long Tie-Break (terzo set).',
      usedSets: active,
    };
  }
  if (!isValidLongTiebreakScore(set3.homeGames, set3.awayGames)) {
    return {
      resultType: null,
      error: 'Il punteggio del Long Tie-Break non è valido (si vince a 10 con 2 punti di scarto).',
      usedSets: active,
    };
  }

  const winner3 = winnerOf(set3);
  return {
    resultType: winner3 === 'HOME' ? 'WIN_HOME_TB' : 'WIN_AWAY_TB',
    error: null,
    usedSets: [set1, set2, set3],
  };
}
