export type TournamentStatus = 'IN_CORSO' | 'CONCLUSO' | string;
export type CategoryPhase = 'GIRONE' | 'TABELLONE' | 'CONCLUSA';
export type MatchStatus = 'SCHEDULED' | 'PLAYED';
export type MatchResultType = 'WIN_HOME' | 'WIN_HOME_TB' | 'WIN_AWAY' | 'WIN_AWAY_TB';

export interface TournamentResponse {
  id: number;
  name: string;
  season: string;
  status: TournamentStatus;
}

export interface CategoryResponse {
  id: number;
  tournamentId: number;
  name: string;
  matchFormat: 'SINGLE' | 'MULTI';
  subMatchesCount: number;
  phase: CategoryPhase;
  scheduleLocked: boolean;
}

export interface PlayerResponse {
  id: number;
  name: string;
}

export interface TeamResponse {
  id: number;
  categoryId: number;
  name: string;
  players: PlayerResponse[];
}

export interface MatchResponse {
  id: number;
  homeTeamId: number | null;
  homeTeamName: string | null;
  awayTeamId: number | null;
  awayTeamName: string | null;
  status: MatchStatus;
}

export interface RoundResponse {
  roundNumber: number;
  matches: MatchResponse[];
}

export interface StandingRowResponse {
  position: number;
  teamId: number;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  setsWon: number;
  setsLost: number;
  setDiff: number;
  gamesWon: number;
  gamesLost: number;
  gameDiff: number;
}

export interface SetScoreResponse {
  setNumber: number;
  homeGames: number;
  awayGames: number;
}

export interface SubMatchResponse {
  id: number;
  ordine: number;
  homePlayer1: PlayerResponse | null;
  homePlayer2: PlayerResponse | null;
  awayPlayer1: PlayerResponse | null;
  awayPlayer2: PlayerResponse | null;
  sets: SetScoreResponse[];
  setsWonBy: 'HOME' | 'AWAY' | 'PARITA' | null;
}

export interface MatchDetailResponse {
  id: number;
  categoryId: number;
  phase: 'GIRONE' | 'TABELLONE';
  homeTeamId: number | null;
  homeTeamName: string | null;
  awayTeamId: number | null;
  awayTeamName: string | null;
  status: MatchStatus;
  resultType: MatchResultType | null;
  winnerTeamId: number | null;
  suggestedWinner: 'HOME' | 'AWAY' | 'PARITA' | null;
  subMatches: SubMatchResponse[];
}

export interface BracketMatchResponse {
  matchId: number;
  slot: number;
  homeTeamId: number | null;
  homeTeamName: string | null;
  awayTeamId: number | null;
  awayTeamName: string | null;
  status: MatchStatus;
  resultType: MatchResultType | null;
  winnerTeamId: number | null;
}

export interface BracketRoundResponse {
  roundIndex: number;
  matches: BracketMatchResponse[];
}

export interface BracketResponse {
  totalRounds: number | null;
  rounds: BracketRoundResponse[];
}
