import {
  Collections,
  SubCollections,
  getCollection,
  getDocRef,
  firestoreGet,
  firestoreQuery,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "../lib/firebase/firestore";
import type { Leaderboard, LeaderboardEntry, LeaderboardPeriod } from "../types/leaderboard.types";
import type { Unsubscribe } from "firebase/firestore";
import { MOCK_LEADERBOARD } from "../constants/mockData";

const USE_MOCK = !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === "demo-project";

export const leaderboardService = {
  getPeriodKeys() {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const weekNum = Math.ceil(now.getDate() / 7);
    const week = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
    return {
      allTime: "all_time" as LeaderboardPeriod,
      monthly: `monthly_${month}` as LeaderboardPeriod,
      weekly: `weekly_${week}` as LeaderboardPeriod,
    };
  },

  getLeaderboard: async (period: LeaderboardPeriod): Promise<Leaderboard | null> => {
    if (USE_MOCK) return { ...MOCK_LEADERBOARD, id: period, period };
    const ref = getDocRef<Leaderboard>(Collections.LEADERBOARDS, period);
    const data = await firestoreGet(ref);
    if (!data) return null;
    return { ...data, id: period };
  },

  subscribeToLeaderboard: (
    period: LeaderboardPeriod,
    callback: (board: Leaderboard) => void
  ): Unsubscribe => {
    if (USE_MOCK) {
      callback({ ...MOCK_LEADERBOARD, id: period, period });
      return () => {};
    }
    const ref = getDocRef<Leaderboard>(Collections.LEADERBOARDS, period);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) callback({ ...(snap.data() as Leaderboard), id: snap.id });
    });
  },

  getUserRank: async (
    uid: string,
    period: LeaderboardPeriod
  ): Promise<LeaderboardEntry | null> => {
    if (USE_MOCK) {
      return MOCK_LEADERBOARD.topEntries.find((e) => e.userId === uid) ?? null;
    }
    const entries = await firestoreQuery<LeaderboardEntry>(
      query(
        getCollection<LeaderboardEntry>(
          `${Collections.LEADERBOARDS}/${period}/${SubCollections.ENTRIES}`
        ),
        orderBy("score", "desc"),
        limit(200)
      )
    );
    return entries.find((e) => e.userId === uid) ?? null;
  },
};
