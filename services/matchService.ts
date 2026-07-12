import {
  Collections,
  getCollection,
  getDocRef,
  firestoreGet,
  firestoreQuery,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "../lib/firebase/firestore";
import type { Match, MatchEvent } from "../types/match.types";
import type { Unsubscribe } from "firebase/firestore";
import { MOCK_MATCHES } from "../constants/mockData";

const USE_MOCK = !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === "demo-project";

export const matchService = {
  getLiveMatches: async (): Promise<Match[]> => {
    if (USE_MOCK) return MOCK_MATCHES.filter((m) => m.status === "LIVE");
    return firestoreQuery<Match>(
      query(
        getCollection<Match>(Collections.MATCHES),
        where("status", "==", "LIVE"),
        orderBy("utcDate", "asc")
      )
    );
  },

  getFeaturedMatches: async (): Promise<Match[]> => {
    if (USE_MOCK) return MOCK_MATCHES.filter((m) => m.isFeatured);
    return firestoreQuery<Match>(
      query(
        getCollection<Match>(Collections.MATCHES),
        where("isFeatured", "==", true),
        where("status", "in", ["SCHEDULED", "LIVE"]),
        orderBy("utcDate", "asc"),
        limit(20)
      )
    );
  },

  getUpcomingMatches: async (limitCount = 50): Promise<Match[]> => {
    if (USE_MOCK) return MOCK_MATCHES.filter((m) => m.status === "SCHEDULED");
    return firestoreQuery<Match>(
      query(
        getCollection<Match>(Collections.MATCHES),
        where("status", "==", "SCHEDULED"),
        orderBy("utcDate", "asc"),
        limit(limitCount)
      )
    );
  },

  getMatchesByLeague: async (leagueId: string, limitCount = 50): Promise<Match[]> => {
    if (USE_MOCK) return MOCK_MATCHES.filter((m) => m.leagueId === leagueId);
    return firestoreQuery<Match>(
      query(
        getCollection<Match>(Collections.MATCHES),
        where("leagueId", "==", leagueId),
        where("status", "in", ["SCHEDULED", "LIVE", "FINISHED"]),
        orderBy("utcDate", "desc"),
        limit(limitCount)
      )
    );
  },

  getMatchById: async (matchId: string): Promise<Match | null> => {
    if (USE_MOCK) {
      return MOCK_MATCHES.find((m) => m.id === matchId) ?? null;
    }
    const ref = getDocRef<Match>(Collections.MATCHES, matchId);
    const data = await firestoreGet(ref);
    if (!data) return null;
    return { ...data, id: matchId };
  },

  getMatchEvents: async (matchId: string): Promise<MatchEvent[]> => {
    if (USE_MOCK) return [];
    return firestoreQuery<MatchEvent>(
      query(
        getCollection<MatchEvent>(`${Collections.MATCHES}/${matchId}/events`),
        orderBy("minute", "asc")
      )
    );
  },

  subscribeToMatch: (
    matchId: string,
    callback: (match: Match) => void
  ): Unsubscribe => {
    if (USE_MOCK) {
      const m = MOCK_MATCHES.find((x) => x.id === matchId);
      if (m) callback(m);
      return () => {};
    }
    const ref = getDocRef<Match>(Collections.MATCHES, matchId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback({ ...(snap.data() as Match), id: snap.id });
      }
    });
  },

  subscribeToLiveMatches: (
    callback: (matches: Match[]) => void
  ): Unsubscribe => {
    if (USE_MOCK) {
      callback(MOCK_MATCHES.filter((m) => m.status === "LIVE"));
      return () => {};
    }
    const q = query(
      getCollection<Match>(Collections.MATCHES),
      where("status", "==", "LIVE"),
      orderBy("utcDate", "asc")
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ ...(d.data() as Match), id: d.id })));
    });
  },
};
