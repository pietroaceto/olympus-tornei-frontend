import type { BracketRoundResponse } from '../api/types';
import { teamLabel } from '../lib/format';

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
    <div className="bracket">
      {rounds.map((round) => (
        <div key={round.roundIndex} className="bracket-round">
          <div className="bracket-round__header">
            <h2>{roundName(round.roundIndex, totalRounds)}</h2>
            <span className="bracket-round__count">
              {round.matches.length} {round.matches.length === 1 ? 'incontro' : 'incontri'}
            </span>
          </div>
          <div className="bracket-round__matches">
            {round.matches.map((match) => (
              <button
                key={match.matchId}
                type="button"
                className="bracket-match"
                disabled={isMatchClickable ? !isMatchClickable(match) : false}
                onClick={() => onMatchClick(match.matchId)}
              >
                <span
                  className={`bracket-match__team${
                    match.homeTeamName === null ? ' bracket-match__team--tbd' : ''
                  }${match.winnerTeamId !== null && match.winnerTeamId === match.homeTeamId ? ' bracket-match__team--winner' : ''}`}
                >
                  {teamLabel(match.homeTeamName)}
                </span>
                <span className="bracket-match__divider" />
                <span
                  className={`bracket-match__team${
                    match.awayTeamName === null ? ' bracket-match__team--tbd' : ''
                  }${match.winnerTeamId !== null && match.winnerTeamId === match.awayTeamId ? ' bracket-match__team--winner' : ''}`}
                >
                  {teamLabel(match.awayTeamName)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
