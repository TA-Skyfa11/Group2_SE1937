import { Timestamp } from "firebase/firestore";
import type { Match } from "../types/match.types";
import type { League, Standing } from "../types/league.types";
import type { Team, Player } from "../types/team.types";
import type { Leaderboard } from "../types/leaderboard.types";

const now = Timestamp.now();
const future = Timestamp.fromDate(new Date(Date.now() + 3600000 * 2));
const past = Timestamp.fromDate(new Date(Date.now() - 3600000 * 3));

export const MOCK_MATCHES: Match[] = [
  {
    id: "mock-match-1",
    externalId: "ext-1",
    leagueId: "league-pl",
    leagueName: "Premier League",
    leagueLogo: "",
    seasonId: "season-2024",
    homeTeam: { id: "team-manu", name: "Manchester United", shortName: "Man Utd", tla: "MUN", crest: "" },
    awayTeam: { id: "team-mci", name: "Manchester City", shortName: "Man City", tla: "MCI", crest: "" },
    utcDate: future,
    status: "SCHEDULED",
    minute: null,
    score: { fullTime: { home: null, away: null }, halfTime: { home: null, away: null }, extraTime: null, penalties: null },
    odds: { homeWin: 2.5, draw: 3.2, awayWin: 2.8, lastUpdated: now },
    predictionStats: { totalBets: 120, homeWinBets: 50, drawBets: 30, awayWinBets: 40, totalCoinsWagered: 8500 },
    isPredictionOpen: true,
    isSettled: false,
    isFeatured: true,
    venue: "Old Trafford",
    referee: "M. Dean",
    stage: "Matchday 20",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "mock-match-2",
    externalId: "ext-2",
    leagueId: "league-ucl",
    leagueName: "UEFA Champions League",
    leagueLogo: "",
    seasonId: "season-2024",
    homeTeam: { id: "team-rm", name: "Real Madrid", shortName: "Real Madrid", tla: "RMA", crest: "" },
    awayTeam: { id: "team-barca", name: "Barcelona", shortName: "Barcelona", tla: "BAR", crest: "" },
    utcDate: now,
    status: "LIVE",
    minute: 67,
    score: { fullTime: { home: 2, away: 1 }, halfTime: { home: 1, away: 0 }, extraTime: null, penalties: null },
    odds: { homeWin: 1.8, draw: 3.5, awayWin: 4.2, lastUpdated: now },
    predictionStats: { totalBets: 350, homeWinBets: 200, drawBets: 80, awayWinBets: 70, totalCoinsWagered: 42000 },
    isPredictionOpen: false,
    isSettled: false,
    isFeatured: true,
    venue: "Bernabeu",
    referee: "C. Turpin",
    stage: "Round of 16",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "mock-match-3",
    externalId: "ext-3",
    leagueId: "league-ll",
    leagueName: "La Liga",
    leagueLogo: "",
    seasonId: "season-2024",
    homeTeam: { id: "team-atl", name: "Atletico Madrid", shortName: "Atletico", tla: "ATM", crest: "" },
    awayTeam: { id: "team-sev", name: "Sevilla", shortName: "Sevilla", tla: "SEV", crest: "" },
    utcDate: past,
    status: "FINISHED",
    minute: 90,
    score: { fullTime: { home: 3, away: 1 }, halfTime: { home: 1, away: 1 }, extraTime: null, penalties: null },
    odds: { homeWin: 1.9, draw: 3.4, awayWin: 3.8, lastUpdated: now },
    predictionStats: { totalBets: 89, homeWinBets: 55, drawBets: 20, awayWinBets: 14, totalCoinsWagered: 12000 },
    isPredictionOpen: false,
    isSettled: true,
    isFeatured: false,
    venue: "Wanda Metropolitano",
    referee: "J. Gil",
    stage: "Matchday 18",
    createdAt: now,
    updatedAt: now,
  },
];

export const MOCK_LEAGUES: League[] = [
  { id: "league-pl", name: "Premier League", shortName: "PL", country: "England", logo: "", type: "domestic", currentSeasonId: "season-2024", externalId: "PL" },
  { id: "league-ucl", name: "UEFA Champions League", shortName: "UCL", country: "Europe", logo: "", type: "continental", currentSeasonId: "season-2024", externalId: "CL" },
  { id: "league-ll", name: "La Liga", shortName: "LL", country: "Spain", logo: "", type: "domestic", currentSeasonId: "season-2024", externalId: "PD" },
  { id: "league-bl", name: "Bundesliga", shortName: "BL", country: "Germany", logo: "", type: "domestic", currentSeasonId: "season-2024", externalId: "BL1" },
  { id: "league-sa", name: "Serie A", shortName: "SA", country: "Italy", logo: "", type: "domestic", currentSeasonId: "season-2024", externalId: "SA" },
];

export const MOCK_STANDINGS: Standing = {
  id: "standing-pl",
  leagueId: "league-pl",
  seasonId: "season-2024",
  stage: "REGULAR_SEASON",
  group: null,
  lastUpdated: now,
  table: [
    { position: 1, teamId: "team-mci", teamName: "Manchester City", teamCrest: "", playedGames: 20, won: 14, draw: 4, lost: 2, goalsFor: 48, goalsAgainst: 18, goalDifference: 30, points: 46, form: "WWWDW" },
    { position: 2, teamId: "team-ars", teamName: "Arsenal", teamCrest: "", playedGames: 20, won: 13, draw: 4, lost: 3, goalsFor: 42, goalsAgainst: 20, goalDifference: 22, points: 43, form: "WWWWL" },
    { position: 3, teamId: "team-liv", teamName: "Liverpool", teamCrest: "", playedGames: 20, won: 13, draw: 3, lost: 4, goalsFor: 45, goalsAgainst: 22, goalDifference: 23, points: 42, form: "WDWWW" },
    { position: 4, teamId: "team-che", teamName: "Chelsea", teamCrest: "", playedGames: 20, won: 11, draw: 5, lost: 4, goalsFor: 38, goalsAgainst: 25, goalDifference: 13, points: 38, form: "WWDLW" },
    { position: 5, teamId: "team-manu", teamName: "Manchester United", teamCrest: "", playedGames: 20, won: 10, draw: 4, lost: 6, goalsFor: 32, goalsAgainst: 28, goalDifference: 4, points: 34, form: "WLWDL" },
    { position: 6, teamId: "team-tot", teamName: "Tottenham", teamCrest: "", playedGames: 20, won: 9, draw: 4, lost: 7, goalsFor: 35, goalsAgainst: 32, goalDifference: 3, points: 31, form: "LWWLD" },
    { position: 7, teamId: "team-new", teamName: "Newcastle", teamCrest: "", playedGames: 20, won: 9, draw: 3, lost: 8, goalsFor: 30, goalsAgainst: 28, goalDifference: 2, points: 30, form: "WLLWW" },
    { position: 8, teamId: "team-avl", teamName: "Aston Villa", teamCrest: "", playedGames: 20, won: 8, draw: 5, lost: 7, goalsFor: 28, goalsAgainst: 26, goalDifference: 2, points: 29, form: "DWLWD" },
  ],
};

export const MOCK_LEADERBOARD: Leaderboard = {
  id: "all_time",
  period: "all_time",
  computedAt: now,
  topEntries: [
    { rank: 1, userId: "user-1", displayName: "PredictionKing", avatarUrl: null, coins: 15420, winRate: 0.72, totalPredictions: 89, correctPredictions: 64, currentStreak: 7, score: 8234 },
    { rank: 2, userId: "user-2", displayName: "FootballGuru", avatarUrl: null, coins: 12800, winRate: 0.68, totalPredictions: 75, correctPredictions: 51, currentStreak: 4, score: 7100 },
    { rank: 3, userId: "user-3", displayName: "BettingPro", avatarUrl: null, coins: 11200, winRate: 0.65, totalPredictions: 60, correctPredictions: 39, currentStreak: 2, score: 6320 },
    { rank: 4, userId: "user-4", displayName: "GoalMaster", avatarUrl: null, coins: 9800, winRate: 0.61, totalPredictions: 54, correctPredictions: 33, currentStreak: 0, score: 5540 },
    { rank: 5, userId: "user-5", displayName: "TacticianX", avatarUrl: null, coins: 8500, winRate: 0.58, totalPredictions: 50, correctPredictions: 29, currentStreak: 3, score: 4890 },
    { rank: 6, userId: "user-6", displayName: "MatchWizard", avatarUrl: null, coins: 7200, winRate: 0.55, totalPredictions: 45, correctPredictions: 25, currentStreak: 1, score: 4210 },
    { rank: 7, userId: "user-7", displayName: "ScoreHunter", avatarUrl: null, coins: 6100, winRate: 0.52, totalPredictions: 40, correctPredictions: 21, currentStreak: 0, score: 3560 },
    { rank: 8, userId: "user-8", displayName: "PitchProphet", avatarUrl: null, coins: 5400, winRate: 0.50, totalPredictions: 38, correctPredictions: 19, currentStreak: 2, score: 3120 },
  ],
};

// ─── Mock users for Admin management ──────────────────────────────────────────
// This is a mutable, in-memory, session-only "database" (mirrors the pattern
// used by mockPredictions in predictionService.ts). Admin actions (lock/unlock,
// change role, adjust coins) mutate this array directly so the effect is
// visible immediately and persists while the app is running, even though it
// resets on app restart (no real backend in mock mode).
export interface MockUser {
  uid: string;
  displayName: string;
  email: string;
  role: "user" | "admin";
  coinBalance: number;
  totalPredictions: number;
  winRate: number;
  isActive: boolean;
}

export const MOCK_USERS: MockUser[] = [
  { uid: "user-1", displayName: "PredictionKing", email: "predictionking@test.com", role: "user", coinBalance: 15420, totalPredictions: 89, winRate: 0.72, isActive: true },
  { uid: "user-2", displayName: "FootballGuru", email: "footballguru@test.com", role: "user", coinBalance: 12800, totalPredictions: 75, winRate: 0.68, isActive: true },
  { uid: "user-3", displayName: "BettingPro", email: "bettingpro@test.com", role: "user", coinBalance: 11200, totalPredictions: 60, winRate: 0.65, isActive: true },
  { uid: "user-4", displayName: "GoalMaster", email: "goalmaster@test.com", role: "user", coinBalance: 9800, totalPredictions: 54, winRate: 0.61, isActive: true },
  { uid: "user-5", displayName: "TacticianX", email: "tacticianx@test.com", role: "user", coinBalance: 8500, totalPredictions: 50, winRate: 0.58, isActive: false },
  { uid: "user-6", displayName: "MatchWizard", email: "matchwizard@test.com", role: "user", coinBalance: 7200, totalPredictions: 45, winRate: 0.55, isActive: true },
  { uid: "user-7", displayName: "ScoreHunter", email: "scorehunter@test.com", role: "user", coinBalance: 6100, totalPredictions: 40, winRate: 0.52, isActive: true },
  { uid: "user-8", displayName: "PitchProphet", email: "pitchprophet@test.com", role: "user", coinBalance: 5400, totalPredictions: 38, winRate: 0.50, isActive: true },
  { uid: "admin-1", displayName: "Người dùng Demo", email: "admin@test.com", role: "admin", coinBalance: 1000, totalPredictions: 0, winRate: 0, isActive: true },
];
