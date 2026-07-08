import {
  Collections,
  getCollection,
  getDocRef,
  firestoreGet,
  firestoreQuery,
  query,
  orderBy,
  limit,
} from "../lib/firebase/firestore";
import type { League, Standing } from "../types/league.types";
import { MOCK_LEAGUES, MOCK_STANDINGS } from "../constants/mockData";

const USE_MOCK = !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === "demo-project";

export const leagueService = {
  getAllLeagues: async (): Promise<League[]> => {
    if (USE_MOCK) return MOCK_LEAGUES;
    return firestoreQuery<League>(
      query(getCollection<League>(Collections.LEAGUES), orderBy("name", "asc"))
    );
  },

  getLeagueById: async (leagueId: string): Promise<League | null> => {
    if (USE_MOCK) return MOCK_LEAGUES.find((l) => l.id === leagueId) ?? null;
    const ref = getDocRef<League>(Collections.LEAGUES, leagueId);
    const data = await firestoreGet(ref);
    if (!data) return null;
    return { ...data, id: leagueId };
  },

  getStandings: async (leagueId: string): Promise<Standing | null> => {
    if (USE_MOCK) {
      return MOCK_STANDINGS.leagueId === leagueId ? MOCK_STANDINGS : null;
    }
    const results = await firestoreQuery<Standing>(
      query(
        getCollection<Standing>(`${Collections.LEAGUES}/${leagueId}/standings`),
        orderBy("lastUpdated", "desc"),
        limit(1)
      )
    );
    return results[0] ?? null;
  },
};
