import axios, { AxiosInstance } from "axios";

const BASE_URL = "https://api.football-data.org/v4";

// ─── Raw football-data.org response shapes (only fields we use) ──────────────

export interface FDCompetition {
  id: number;
  name: string;
  code: string;
  emblem: string | null;
  currentSeason: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number | null;
  } | null;
}

export interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string | null;
  crest: string | null;
}

export interface FDScore {
  home: number | null;
  away: number | null;
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status:
    | "SCHEDULED"
    | "TIMED"
    | "IN_PLAY"
    | "PAUSED"
    | "FINISHED"
    | "POSTPONED"
    | "SUSPENDED"
    | "CANCELLED";
  matchday: number | null;
  stage: string | null;
  venue?: string | null;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: {
    winner: string | null;
    fullTime: FDScore;
    halfTime: FDScore;
  };
  competition: {
    id: number;
    name: string;
    code: string;
    emblem: string | null;
  };
}

export interface FDStandingRow {
  position: number;
  team: FDTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string | null;
}

export interface FDStandingsResponse {
  competition: { id: number; name: string; code: string };
  season: { id: number; startDate: string; endDate: string };
  standings: {
    stage: string;
    type: string; // "TOTAL" | "HOME" | "AWAY"
    group: string | null;
    table: FDStandingRow[];
  }[];
}

// ─── Client ────────────────────────────────────────────────────────────────

export function createFootballDataClient(apiKey: string): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 15_000,
    headers: {
      "X-Auth-Token": apiKey,
    },
  });

  // football-data.org explicitly asks integrators to respect these
  // rate-limit headers instead of blindly firing requests:
  //   X-Requests-Available-Minute — requests left in the current minute window
  //   X-RequestCounter-Reset      — seconds until the window resets
  // Free plan = 10 requests/minute. We log a warning when running low so
  // sync jobs are easy to diagnose if they ever start throttling (HTTP 429).
  client.interceptors.response.use(
    (response) => {
      const remaining = response.headers["x-requests-available-minute"];
      const resetIn = response.headers["x-requestcounter-reset"];
      if (remaining !== undefined) {
        const remainingNum = Number(remaining);
        if (remainingNum <= 2) {
          console.warn(
            `[football-data.org] Rate limit low: ${remaining} requests left this minute (resets in ${resetIn}s).`
          );
        }
      }
      return response;
    },
    (error) => {
      if (error.response?.status === 429) {
        const resetIn = error.response.headers["x-requestcounter-reset"];
        console.error(
          `[football-data.org] 429 Too Many Requests — rate limit hit. Resets in ${resetIn ?? "?"}s.`
        );
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const footballDataProvider = {
  async getCompetition(
    client: AxiosInstance,
    code: string
  ): Promise<FDCompetition> {
    const { data } = await client.get<FDCompetition>(`/competitions/${code}`);
    return data;
  },

  /**
   * Standings table for the competition's current season.
   * Only the "TOTAL" table type is used (not home/away splits).
   */
  async getStandings(
    client: AxiosInstance,
    code: string
  ): Promise<FDStandingsResponse> {
    const { data } = await client.get<FDStandingsResponse>(
      `/competitions/${code}/standings`
    );
    return data;
  },

  /**
   * Matches for a competition within a date window.
   * dateFrom/dateTo format: YYYY-MM-DD
   */
  async getMatches(
    client: AxiosInstance,
    code: string,
    dateFrom: string,
    dateTo: string
  ): Promise<FDMatch[]> {
    const { data } = await client.get<{ matches: FDMatch[] }>(
      `/competitions/${code}/matches`,
      { params: { dateFrom, dateTo } }
    );
    return data.matches;
  },
};
