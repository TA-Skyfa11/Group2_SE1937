import { Timestamp } from "firebase-admin/firestore";
import { FDMatch, FDTeam } from "../providers/footballDataProvider";
import { LeagueMapping } from "./leagueMap";

type OurMatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

function mapStatus(fdStatus: FDMatch["status"]): OurMatchStatus {
  switch (fdStatus) {
    case "IN_PLAY":
      return "LIVE";
    case "PAUSED":
      return "PAUSED";
    case "TIMED":
    case "SCHEDULED":
      return "SCHEDULED";
    case "FINISHED":
      return "FINISHED";
    case "POSTPONED":
      return "POSTPONED";
    case "SUSPENDED":
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "SCHEDULED";
  }
}

function mapTeamSnapshot(team: FDTeam) {
  // Với các trận vòng loại/knockout mà đối thủ chưa được xác định (phụ
  // thuộc kết quả vòng trước), football-data.org trả về team gần như
  // rỗng hoàn toàn (id/name/crest đều null/undefined). Không xử lý riêng
  // sẽ ra "team-undefined" và tên/ảnh trống -> hiện dấu "?" trên app.
  if (!team || !team.id) {
    return {
      id: "team-tbd",
      name: "Chưa xác định",
      shortName: "Chưa xác định",
      tla: "TBD",
      crest: "",
    };
  }
  return {
    id: `team-${team.id}`,
    name: team.name || "Chưa xác định",
    shortName: team.shortName || team.name || "TBD",
    tla: team.tla || team.shortName?.slice(0, 3).toUpperCase() || "TBD",
    crest: team.crest ?? "",
  };
}

/**
 * Rough live-match elapsed minute estimate. football-data.org's free tier
 * does not return an official "minute" field, so we approximate it from
 * kickoff time. Good enough for UI display; not perfectly authoritative.
 */
function estimateMinute(utcDate: string, status: OurMatchStatus): number | null {
  if (status !== "LIVE") return null;
  const kickoff = new Date(utcDate).getTime();
  const elapsedMin = Math.floor((Date.now() - kickoff) / 60000);
  return Math.max(0, Math.min(elapsedMin, 90));
}

const DEFAULT_ODDS = { homeWin: 1.8, draw: 3.2, awayWin: 2.5 };

/**
 * Converts a football-data.org match into the fields our Firestore `matches`
 * documents use. Deliberately does NOT include `odds` or `predictionStats`
 * on update — those fields belong to the prediction system, not the sync
 * job, and must never be clobbered by a periodic data refresh.
 */
export function mapMatchForUpsert(
  fdMatch: FDMatch,
  league: LeagueMapping,
  isFirstWrite: boolean
) {
  const status = mapStatus(fdMatch.status);
  const isSettled = status === "FINISHED";
  const isPredictionOpen = status === "SCHEDULED";

  const base = {
    externalId: String(fdMatch.id),
    leagueId: league.ourId,
    leagueName: league.name,
    leagueLogo: fdMatch.competition.emblem ?? "",
    seasonId: `${league.ourId}-current`,
    homeTeam: mapTeamSnapshot(fdMatch.homeTeam),
    awayTeam: mapTeamSnapshot(fdMatch.awayTeam),
    utcDate: Timestamp.fromDate(new Date(fdMatch.utcDate)),
    status,
    minute: estimateMinute(fdMatch.utcDate, status),
    score: {
      fullTime: {
        home: fdMatch.score.fullTime.home,
        away: fdMatch.score.fullTime.away,
      },
      halfTime: {
        home: fdMatch.score.halfTime.home,
        away: fdMatch.score.halfTime.away,
      },
      extraTime: null,
      penalties: null,
    },
    isPredictionOpen,
    isSettled,
    isFeatured: false,
    venue: fdMatch.venue ?? null,
    referee: null,
    stage: fdMatch.stage ?? null,
    updatedAt: Timestamp.now(),
  };

  if (isFirstWrite) {
    return {
      ...base,
      odds: { ...DEFAULT_ODDS, lastUpdated: Timestamp.now() },
      predictionStats: {
        totalBets: 0,
        homeWinBets: 0,
        drawBets: 0,
        awayWinBets: 0,
        totalCoinsWagered: 0,
      },
      createdAt: Timestamp.now(),
    };
  }

  return base;
}

export function matchDocId(fdMatch: FDMatch): string {
  return `fd-${fdMatch.id}`;
}
