import type { Timestamp } from "firebase/firestore";

export type MatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export type PredictionOutcome = "HOME_WIN" | "DRAW" | "AWAY_WIN";

export interface TeamSnapshot {
  id: string;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface Score {
  home: number | null;
  away: number | null;
}

export interface MatchScore {
  fullTime: Score;
  halfTime: Score;
  extraTime: Score | null;
  penalties: Score | null;
}

export interface MatchOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
  lastUpdated: Timestamp | null;
}

export interface PredictionStats {
  totalBets: number;
  homeWinBets: number;
  drawBets: number;
  awayWinBets: number;
  totalCoinsWagered: number;
}

export interface Match {
  id: string;
  externalId: string;
  leagueId: string;
  leagueName: string;
  leagueLogo: string;
  seasonId: string;
  homeTeam: TeamSnapshot;
  awayTeam: TeamSnapshot;
  utcDate: Timestamp;
  status: MatchStatus;
  minute: number | null;
  score: MatchScore;
  odds: MatchOdds;
  predictionStats: PredictionStats;
  isPredictionOpen: boolean;
  isSettled: boolean;
  isFeatured: boolean;
  venue: string | null;
  referee: string | null;
  stage: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  type: "GOAL" | "YELLOW_CARD" | "RED_CARD" | "SUBSTITUTION" | "VAR" | "PENALTY";
  teamId: string;
  playerId: string | null;
  playerName: string | null;
  relatedPlayerId: string | null;
  relatedPlayerName: string | null;
  detail: string | null;
  createdAt: Timestamp | null;
}

export interface MatchLineup {
  teamId: string;
  formation: string;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface LineupPlayer {
  playerId: string;
  name: string;
  number: number;
  position: string;
}
