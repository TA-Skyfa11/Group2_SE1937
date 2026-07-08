import type { Timestamp } from "firebase/firestore";
import type { PredictionOutcome } from "./match.types";

export type PredictionStatus = "PENDING" | "WON" | "LOST" | "VOID";

export interface MatchSnapshot {
  homeTeam: { name: string; crest: string };
  awayTeam: { name: string; crest: string };
  utcDate: Timestamp;
  leagueName: string;
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  matchSnapshot: MatchSnapshot;
  outcome: PredictionOutcome;
  amount: number;
  oddsAtTime: number;
  potentialPayout: number;
  actualPayout: number | null;
  status: PredictionStatus;
  settledAt: Timestamp | null;
  createdAt: Timestamp;
}

export interface PlacePredictionPayload {
  matchId: string;
  outcome: PredictionOutcome;
  amount: number;
}
