import type { MatchResponse } from '../api/types';
import { matchStatusLabel, teamLabel } from '../lib/format';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

/**
 * Riga di un match nel calendario del girone: nomi delle squadre una sotto l'altra
 * e punteggi dei set in verticale, sullo stesso schema della card di inserimento
 * risultato (MatchResultForm).
 */
export function MatchScoreRow({ match }: { match: MatchResponse }) {
  const played = match.status === 'PLAYED';
  const blocks = match.subMatches.length > 0 ? match.subMatches : [{ ordine: 0, sets: [] }];

  return (
    <div className="flex w-full items-center gap-2 sm:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2">
        {blocks.map((sm, i) => (
          <div key={sm.ordine ?? i} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <span
                className={cn(
                  'truncate',
                  !played && 'text-muted-foreground',
                  match.winnerTeamId !== null && match.winnerTeamId === match.homeTeamId && 'font-bold text-primary',
                )}
              >
                {teamLabel(match.homeTeamName)}
              </span>
              {sm.sets.length > 0 && (
                <div className="flex shrink-0 gap-1.5 sm:gap-3">
                  {sm.sets.map((s) => (
                    <span key={s.setNumber} className="w-4 text-center text-sm font-semibold sm:w-5">
                      {s.homeGames}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <span
                className={cn(
                  'truncate',
                  !played && 'text-muted-foreground',
                  match.winnerTeamId !== null && match.winnerTeamId === match.awayTeamId && 'font-bold text-primary',
                )}
              >
                {teamLabel(match.awayTeamName)}
              </span>
              {sm.sets.length > 0 && (
                <div className="flex shrink-0 gap-1.5 sm:gap-3">
                  {sm.sets.map((s) => (
                    <span key={s.setNumber} className="w-4 text-center text-sm font-semibold sm:w-5">
                      {s.awayGames}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Badge variant={played ? 'default' : 'outline'} className="shrink-0">
        {matchStatusLabel(match.status)}
      </Badge>
    </div>
  );
}
