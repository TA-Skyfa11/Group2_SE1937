/**
 * Maps our internal Firestore league IDs (matching the IDs already used
 * in the client's mock data, so switching from mock -> real data requires
 * zero changes on the client) to football-data.org competition codes.
 *
 * Free tier competitions used: PL, PD, BL1, SA, CL
 * (Premier League, La Liga, Bundesliga, Serie A, Champions League)
 */
export interface LeagueMapping {
  ourId: string;
  code: string; // football-data.org competition code
  name: string;
  shortName: string;
  country: string;
  type: "domestic" | "continental" | "international";
}

export const LEAGUE_MAPPINGS: LeagueMapping[] = [
  { ourId: "league-pl", code: "PL", name: "Premier League", shortName: "PL", country: "England", type: "domestic" },
  { ourId: "league-ll", code: "PD", name: "La Liga", shortName: "LL", country: "Spain", type: "domestic" },
  { ourId: "league-bl", code: "BL1", name: "Bundesliga", shortName: "BL", country: "Germany", type: "domestic" },
  { ourId: "league-sa", code: "SA", name: "Serie A", shortName: "SA", country: "Italy", type: "domestic" },
  { ourId: "league-ucl", code: "CL", name: "UEFA Champions League", shortName: "UCL", country: "Europe", type: "continental" },
];

export function getMappingByOurId(ourId: string): LeagueMapping | undefined {
  return LEAGUE_MAPPINGS.find((m) => m.ourId === ourId);
}

export function getMappingByCode(code: string): LeagueMapping | undefined {
  return LEAGUE_MAPPINGS.find((m) => m.code === code);
}
