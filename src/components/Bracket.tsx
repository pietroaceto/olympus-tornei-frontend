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
    <div className="flex items-stretch gap-10 overflow-x-auto p-2 pb-4">
      {rounds.map((round, roundPos) => (
        <div key={round.roundIndex} className="flex w-48 shrink-0 flex-col">
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
                        "after:absolute after:top-1/2 after:right-[-21px] after:h-px after:w-5 after:bg-border after:content-['']",
                      roundPos > 0 &&
                        "before:absolute before:top-1/2 before:left-[-21px] before:h-px before:w-5 before:bg-border before:content-['']",
                    )}
                    disabled={isMatchClickable ? !isMatchClickable(match) : false}
                    onClick={() => onMatchClick(match.matchId)}
                  >
                    <span className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
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
                        <span className="flex shrink-0 gap-1.5 text-xs font-semibold">
                          {sets.map((s) => (
                            <span key={s.setNumber} className="w-3.5 text-center">
                              {s.homeGames}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    <span className="h-px bg-border" />
                    <span className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
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
                        <span className="flex shrink-0 gap-1.5 text-xs font-semibold">
                          {sets.map((s) => (
                            <span key={s.setNumber} className="w-3.5 text-center">
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
