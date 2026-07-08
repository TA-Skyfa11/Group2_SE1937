import type { Timestamp } from "firebase/firestore";

export type LeaderboardPeriod = string;

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  coins: number;
  winRate: number;
  totalPredictions: number;
  correctPredictions: number;
  currentStreak: number;
  score: number;
}

export interface Leaderboard {
  id: string;
  period: LeaderboardPeriod;
  computedAt: Timestamp | null;
  topEntries: LeaderboardEntry[];
}
