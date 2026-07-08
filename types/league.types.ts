import type { Timestamp } from "firebase/firestore";

export interface League {
  id: string;
  name: string;
  shortName: string;
  country: string;
  logo: string;
  type: "domestic" | "continental" | "international";
  currentSeasonId: string;
  externalId: string;
}

export interface Season {
  id: string;
  leagueId: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface StandingRow {
  position: number;
  teamId: string;
  teamName: string;
  teamCrest: string;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string;
}

export interface Standing {
  id: string;
  leagueId: string;
  seasonId: string;
  stage: string;
  group: string | null;
  table: StandingRow[];
  lastUpdated: Timestamp | null;
}
