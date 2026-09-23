export type TournamentStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED';
export type CategoryPhase = 'GIRONE' | 'TABELLONE' | 'CONCLUSA';
export type CategoryName = 'GOLD' | 'SILVER' | 'BRONZE';
export type MatchFormat = 'SINGLE' | 'MULTI';
export type CompetitionFormat = 'GIRONE' | 'TABELLONE';
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
  matchFormat: MatchFormat;
  subMatchesCount: number;
  phase: CategoryPhase;
  scheduleLocked: boolean;
  competitionFormat: CompetitionFormat;
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
  resultType: MatchResultType | null;
  winnerTeamId: number | null;
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

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  role: string;
}

export interface TournamentRequest {
  name: string;
  season: string | null;
  status: TournamentStatus;
}

export interface CategoryRequest {
  name: CategoryName;
  matchFormat: MatchFormat;
  subMatchesCount: number | null;
  competitionFormat: CompetitionFormat;
}

export interface TeamCreateRequest {
  name: string;
  players: string[];
}

export interface TeamUpdateRequest {
  name: string;
}

export interface PlayerRequest {
  name: string;
}

export interface SetScoreRequest {
  setNumber: number;
  homeGames: number;
  awayGames: number;
}

export interface SubMatchRequest {
  homePlayer1Id: number;
  homePlayer2Id: number;
  awayPlayer1Id: number;
  awayPlayer2Id: number;
  sets: SetScoreRequest[];
}

export interface MatchResultRequest {
  subMatches: SubMatchRequest[];
  resultType: MatchResultType;
}

export interface GenerateBracketRequest {
  qualifiedCount: number;
}

export interface ManualBracketRequest {
  slots: (number | null)[];
}
