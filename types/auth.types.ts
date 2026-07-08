import type { Timestamp } from "firebase/firestore";

export type UserRole = "guest" | "user" | "admin";

export interface NotificationPreferences {
  matchStart: boolean;
  matchResult: boolean;
  predictionResult: boolean;
  systemAnnouncements: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  coinBalance: number;
  totalEarned: number;
  totalLost: number;
  totalPredictions: number;
  correctPredictions: number;
  currentStreak: number;
  bestStreak: number;
  winRate: number;
  favoriteTeamIds: string[];
  favoriteMatchIds: string[];
  pushToken: string | null;
  notifPrefs: NotificationPreferences;
  isActive: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  displayName: string;
}
