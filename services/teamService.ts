import {
  Collections,
  getCollection,
  getDocRef,
  firestoreGet,
  firestoreQuery,
  query,
  orderBy,
} from "../lib/firebase/firestore";
import type { Team, Player } from "../types/team.types";

const USE_MOCK = !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === "demo-project";

const MOCK_TEAMS: Team[] = [
  { id: "team-manu", name: "Manchester United", shortName: "Man Utd", tla: "MUN", crest: "", country: "England", venue: { name: "Old Trafford", city: "Manchester", capacity: 74140 }, leagueIds: ["league-pl"], followerCount: 1200, externalId: "66" },
  { id: "team-mci", name: "Manchester City", shortName: "Man City", tla: "MCI", crest: "", country: "England", venue: { name: "Etihad", city: "Manchester", capacity: 55097 }, leagueIds: ["league-pl"], followerCount: 980, externalId: "65" },
  { id: "team-rm", name: "Real Madrid", shortName: "Real Madrid", tla: "RMA", crest: "", country: "Spain", venue: { name: "Bernabeu", city: "Madrid", capacity: 81044 }, leagueIds: ["league-ll", "league-ucl"], followerCount: 2100, externalId: "86" },
  { id: "team-barca", name: "Barcelona", shortName: "Barcelona", tla: "BAR", crest: "", country: "Spain", venue: { name: "Camp Nou", city: "Barcelona", capacity: 99354 }, leagueIds: ["league-ll"], followerCount: 1950, externalId: "81" },
];

export const teamService = {
  getTeamById: async (teamId: string): Promise<Team | null> => {
    if (USE_MOCK) return MOCK_TEAMS.find((t) => t.id === teamId) ?? null;
    const ref = getDocRef<Team>(Collections.TEAMS, teamId);
    const data = await firestoreGet(ref);
    if (!data) return null;
    return { ...data, id: teamId };
  },

  getTeamPlayers: async (teamId: string): Promise<Player[]> => {
    if (USE_MOCK) return [];
    return firestoreQuery<Player>(
      query(
        getCollection<Player>(`${Collections.TEAMS}/${teamId}/players`),
        orderBy("position", "asc"),
        orderBy("name", "asc")
      )
    );
  },
};
