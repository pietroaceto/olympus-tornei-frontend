import type { BracketRoundResponse } from '../api/types';
import { teamLabel } from '../lib/format';
import { GradientBorder } from './GradientBorder';
import { cn } from '@/lib/utils';

function roundName(roundIndex: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - roundIndex;
  if (roundsFromEnd === 1) return 'Finale';
  if (roundsFromEnd === 2) return 'Semifinale';
  if (roundsFromEnd === 3) return 'Quarti di finale';
  return `Turno ${roundIndex + 1}`;
}

export default function Bracket({
  rounds,
  totalRounds,
  onMatchClick,
  isMatchClickable,
}: {
  rounds: BracketRoundResponse[];
  totalRounds: number;
  onMatchClick: (matchId: number) => void;
  /** Default: sempre cliccabile (uso admin, per entrare a inserire il risultato). */
  isMatchClickable?: (match: BracketRoundResponse['matches'][number]) => boolean;
}) {
  return (
    <div className="flex items-stretch gap-6 overflow-x-auto p-2 pb-4 sm:gap-10">
      {rounds.map((round, roundPos) => (
        <div key={round.roundIndex} className="flex w-40 shrink-0 flex-col sm:w-48">
          <div className="mb-4 text-center">
            <h2 className="text-xs font-semibold tracking-wide text-foreground uppercase">
              {roundName(round.roundIndex, totalRounds)}
            </h2>
            <span className="text-xs text-muted-foreground">
              {round.matches.length} {round.matches.length === 1 ? 'incontro' : 'incontri'}
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-around gap-5">
            {round.matches.map((match) => {
              const sets = match.subMatches[0]?.sets ?? [];
              return (
                <GradientBorder key={match.matchId} className="rounded-lg">
                  <button
                    type="button"
                    className={cn(
                      'relative flex w-full flex-col overflow-hidden rounded-lg bg-card text-left disabled:cursor-default',
                      roundPos < rounds.length - 1 &&
                        "after:absolute after:top-1/2 after:right-[-13px] after:h-px after:w-3 after:bg-border after:content-[''] sm:after:right-[-21px] sm:after:w-5",
                      roundPos > 0 &&
                        "before:absolute before:top-1/2 before:left-[-13px] before:h-px before:w-3 before:bg-border before:content-[''] sm:before:left-[-21px] sm:before:w-5",
                    )}
                    disabled={isMatchClickable ? !isMatchClickable(match) : false}
                    onClick={() => onMatchClick(match.matchId)}
                  >
                    <span className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-sm sm:gap-2 sm:px-3 sm:py-2">
                      <span
                        className={cn(
                          'truncate',
                          match.homeTeamName === null && 'text-muted-foreground italic',
                          match.winnerTeamId !== null && match.winnerTeamId === match.homeTeamId && 'font-bold text-primary',
                        )}
                      >
                        {teamLabel(match.homeTeamName)}
                      </span>
                      {sets.length > 0 && (
                        <span className="flex shrink-0 gap-1 text-xs font-semibold sm:gap-1.5">
                          {sets.map((s) => (
                            <span key={s.setNumber} className="w-3 text-center sm:w-3.5">
                              {s.homeGames}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    <span className="h-px bg-border" />
                    <span className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-sm sm:gap-2 sm:px-3 sm:py-2">
                      <span
                        className={cn(
                          'truncate',
                          match.awayTeamName === null && 'text-muted-foreground italic',
                          match.winnerTeamId !== null && match.winnerTeamId === match.awayTeamId && 'font-bold text-primary',
                        )}
                      >
                        {teamLabel(match.awayTeamName)}
                      </span>
                      {sets.length > 0 && (
                        <span className="flex shrink-0 gap-1 text-xs font-semibold sm:gap-1.5">
                          {sets.map((s) => (
                            <span key={s.setNumber} className="w-3 text-center sm:w-3.5">
                              {s.awayGames}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </button>
                </GradientBorder>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
