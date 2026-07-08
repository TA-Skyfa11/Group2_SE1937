export const QUERY_KEYS = {
  matches: {
    all: ["matches"] as const,
    live: ["matches", "live"] as const,
    featured: ["matches", "featured"] as const,
    upcoming: ["matches", "upcoming"] as const,
    byId: (id: string) => ["matches", id] as const,
    events: (id: string) => ["matches", id, "events"] as const,
  },
  leagues: {
    all: ["leagues"] as const,
    byId: (id: string) => ["leagues", id] as const,
    standings: (id: string) => ["leagues", id, "standings"] as const,
  },
  teams: {
    byId: (id: string) => ["teams", id] as const,
    players: (id: string) => ["teams", id, "players"] as const,
  },
  predictions: {
    mine: (uid: string) => ["predictions", "mine", uid] as const,
    forMatch: (matchId: string) => ["predictions", "match", matchId] as const,
  },
  leaderboard: {
    period: (period: string) => ["leaderboard", period] as const,
  },
  notifications: {
    mine: (uid: string) => ["notifications", uid] as const,
  },
  user: {
    profile: (uid: string) => ["user", uid] as const,
    transactions: (uid: string) => ["user", uid, "transactions"] as const,
  },
} as const;
