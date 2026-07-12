/**
 * Đồng bộ dữ liệu bóng đá thật từ football-data.org vào Firestore.
 *
 * KHÔNG cần Firebase Blaze — script này chạy như 1 Node.js process bình
 * thường (ví dụ trên GitHub Actions), ghi Firestore bằng Service Account
 * key (Admin SDK). Blaze chỉ bắt buộc khi CLOUD FUNCTIONS tự gọi API bên
 * ngoài; ở đây Cloud Functions không tham gia gì cả.
 *
 * Cần 2 biến môi trường (đặt trong GitHub Secrets khi chạy CI):
 *   FOOTBALL_DATA_API_KEY      — API token từ football-data.org
 *   FIREBASE_SERVICE_ACCOUNT   — nội dung JSON đầy đủ của service account key
 *
 * Chạy thử ở máy local:
 *   cd scripts
 *   npm install
 *   FOOTBALL_DATA_API_KEY=xxx FIREBASE_SERVICE_ACCOUNT='{...}' node sync-football-data.js
 */

const axios = require("axios");
const admin = require("firebase-admin");

// ─── Config ────────────────────────────────────────────────────────────────

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!API_KEY) {
  console.error("❌ Thiếu biến môi trường FOOTBALL_DATA_API_KEY");
  process.exit(1);
}
if (!SERVICE_ACCOUNT_JSON) {
  console.error("❌ Thiếu biến môi trường FIREBASE_SERVICE_ACCOUNT");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(SERVICE_ACCOUNT_JSON)),
});
const db = admin.firestore();

const REQUEST_SPACING_MS = 7_000; // giữ dưới 10 req/phút của football-data.org

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── League mapping (giống hệt bản Cloud Functions) ───────────────────────

const LEAGUE_MAPPINGS = [
  { ourId: "league-pl", code: "PL", name: "Premier League", shortName: "PL", country: "England", type: "domestic" },
  { ourId: "league-ll", code: "PD", name: "La Liga", shortName: "LL", country: "Spain", type: "domestic" },
  { ourId: "league-bl", code: "BL1", name: "Bundesliga", shortName: "BL", country: "Germany", type: "domestic" },
  { ourId: "league-sa", code: "SA", name: "Serie A", shortName: "SA", country: "Italy", type: "domestic" },
  { ourId: "league-ucl", code: "CL", name: "UEFA Champions League", shortName: "UCL", country: "Europe", type: "continental" },
  { ourId: "league-wc", code: "WC", name: "FIFA World Cup", shortName: "WC", country: "World", type: "international", season: 2026 },
];

// ─── football-data.org client (đọc rate-limit header theo yêu cầu của họ) ─

const client = axios.create({
  baseURL: "https://api.football-data.org/v4",
  timeout: 15_000,
  headers: { "X-Auth-Token": API_KEY },
});

client.interceptors.response.use(
  (response) => {
    const remaining = response.headers["x-requests-available-minute"];
    if (remaining !== undefined && Number(remaining) <= 2) {
      console.warn(`⚠ Rate limit thấp: còn ${remaining} request trong phút này.`);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 429) {
      console.error("❌ 429 Too Many Requests — bị rate-limit, thử lại sau.");
    }
    return Promise.reject(error);
  }
);

// ─── Mapping helpers ───────────────────────────────────────────────────────

function mapStatus(fdStatus) {
  switch (fdStatus) {
    case "IN_PLAY": return "LIVE";
    case "PAUSED": return "PAUSED";
    case "TIMED":
    case "SCHEDULED": return "SCHEDULED";
    case "FINISHED": return "FINISHED";
    case "POSTPONED": return "POSTPONED";
    case "SUSPENDED":
    case "CANCELLED": return "CANCELLED";
    default: return "SCHEDULED";
  }
}

function mapTeamSnapshot(team) {
  return {
    id: `team-${team.id}`,
    name: team.name,
    shortName: team.shortName ?? team.name,
    tla: team.tla ?? (team.shortName ?? "").slice(0, 3).toUpperCase() ?? "???",
    crest: team.crest ?? "",
  };
}

function estimateMinute(utcDate, status) {
  if (status !== "LIVE") return null;
  const kickoff = new Date(utcDate).getTime();
  const elapsedMin = Math.floor((Date.now() - kickoff) / 60000);
  return Math.max(0, Math.min(elapsedMin, 90));
}

const DEFAULT_ODDS = { homeWin: 1.8, draw: 3.2, awayWin: 2.5 };

function matchDocId(fdMatch) {
  return `fd-${fdMatch.id}`;
}

function mapMatchForUpsert(fdMatch, league, isFirstWrite) {
  const status = mapStatus(fdMatch.status);
  const isSettled = status === "FINISHED";
  const isPredictionOpen = status === "SCHEDULED";

  const base = {
    externalId: String(fdMatch.id),
    leagueId: league.ourId,
    leagueName: league.name,
    leagueLogo: fdMatch.competition?.emblem ?? "",
    seasonId: `${league.ourId}-current`,
    homeTeam: mapTeamSnapshot(fdMatch.homeTeam),
    awayTeam: mapTeamSnapshot(fdMatch.awayTeam),
    utcDate: admin.firestore.Timestamp.fromDate(new Date(fdMatch.utcDate)),
    status,
    minute: estimateMinute(fdMatch.utcDate, status),
    score: {
      fullTime: { home: fdMatch.score.fullTime.home, away: fdMatch.score.fullTime.away },
      halfTime: { home: fdMatch.score.halfTime.home, away: fdMatch.score.halfTime.away },
      extraTime: null,
      penalties: null,
    },
    isPredictionOpen,
    isSettled,
    isFeatured: false,
    venue: fdMatch.venue ?? null,
    referee: null,
    stage: fdMatch.stage ?? null,
    updatedAt: admin.firestore.Timestamp.now(),
  };

  if (isFirstWrite) {
    return {
      ...base,
      odds: { ...DEFAULT_ODDS, lastUpdated: admin.firestore.Timestamp.now() },
      predictionStats: { totalBets: 0, homeWinBets: 0, drawBets: 0, awayWinBets: 0, totalCoinsWagered: 0 },
      createdAt: admin.firestore.Timestamp.now(),
    };
  }
  return base;
}

// ─── Sync: leagues ─────────────────────────────────────────────────────────

async function syncLeagues() {
  console.log("\n=== Đồng bộ giải đấu ===");
  for (const league of LEAGUE_MAPPINGS) {
    try {
      const { data } = await client.get(`/competitions/${league.code}`);
      await db.collection("leagues").doc(league.ourId).set(
        {
          name: league.name,
          shortName: league.shortName,
          country: league.country,
          logo: data.emblem ?? "",
          type: league.type,
          currentSeasonId: `${league.ourId}-current`,
          externalId: league.code,
          updatedAt: admin.firestore.Timestamp.now(),
        },
        { merge: true }
      );
      console.log(`  ✓ ${league.ourId}`);
    } catch (err) {
      console.error(`  ✗ ${league.ourId}:`, err.message);
    }
    await sleep(REQUEST_SPACING_MS);
  }
}

// ─── Sync: standings ───────────────────────────────────────────────────────

async function syncStandings() {
  console.log("\n=== Đồng bộ bảng xếp hạng ===");
  for (const league of LEAGUE_MAPPINGS) {
    try {
      const { data } = await client.get(`/competitions/${league.code}/standings`);
      const totalTable = data.standings.find((s) => s.type === "TOTAL");
      if (!totalTable) {
        console.warn(`  ⚠ ${league.ourId}: không có bảng TOTAL`);
        await sleep(REQUEST_SPACING_MS);
        continue;
      }

      const table = totalTable.table.map((row) => ({
        position: row.position,
        teamId: `team-${row.team.id}`,
        teamName: row.team.name,
        teamCrest: row.team.crest ?? "",
        playedGames: row.playedGames,
        won: row.won,
        draw: row.draw,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDifference: row.goalDifference,
        points: row.points,
        form: row.form ?? "",
      }));

      await db
        .collection("leagues")
        .doc(league.ourId)
        .collection("standings")
        .doc("current")
        .set({
          leagueId: league.ourId,
          seasonId: `${league.ourId}-current`,
          stage: totalTable.stage,
          group: totalTable.group,
          table,
          lastUpdated: admin.firestore.Timestamp.now(),
        });

      console.log(`  ✓ ${league.ourId} (${table.length} đội)`);
    } catch (err) {
      console.error(`  ✗ ${league.ourId}:`, err.message);
    }
    await sleep(REQUEST_SPACING_MS);
  }
}

// ─── Sync: matches + teams ──────────────────────────────────────────────────

async function upsertTeamsFromMatch(fdMatch, leagueOurId) {
  const teams = [fdMatch.homeTeam, fdMatch.awayTeam];
  const batch = db.batch();
  let hasWrites = false;

  for (const team of teams) {
    const teamId = `team-${team.id}`;
    const ref = db.collection("teams").doc(teamId);
    const snap = await ref.get();

    if (!snap.exists) {
      batch.set(ref, {
        name: team.name,
        shortName: team.shortName ?? team.name,
        tla: team.tla ?? "???",
        crest: team.crest ?? "",
        country: "",
        venue: null,
        leagueIds: [leagueOurId],
        followerCount: 0,
        externalId: String(team.id),
      });
      hasWrites = true;
    } else {
      const data = snap.data();
      const leagueIds = data?.leagueIds ?? [];
      if (!leagueIds.includes(leagueOurId)) {
        batch.update(ref, { leagueIds: [...leagueIds, leagueOurId] });
        hasWrites = true;
      }
    }
  }
  if (hasWrites) await batch.commit();
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

async function syncMatches() {
  console.log("\n=== Đồng bộ trận đấu ===");
  const now = new Date();
  const dateFrom = formatDate(new Date(now.getTime() - 30 * 86400_000));
  const dateTo = formatDate(new Date(now.getTime() + 90 * 86400_000));

  for (const league of LEAGUE_MAPPINGS) {
    try {
      const params = { dateFrom, dateTo };
      if (league.season) params.season = league.season;

      const { data } = await client.get(`/competitions/${league.code}/matches`, {
        params,
      });
      const matches = data.matches;

      for (const fdMatch of matches) {
        const docId = matchDocId(fdMatch);
        const ref = db.collection("matches").doc(docId);
        const existing = await ref.get();
        const isFirstWrite = !existing.exists;

        await ref.set(mapMatchForUpsert(fdMatch, league, isFirstWrite), { merge: true });
        await upsertTeamsFromMatch(fdMatch, league.ourId);
      }

      console.log(`  ✓ ${league.ourId} (${matches.length} trận)`);
    } catch (err) {
      console.error(`  ✗ ${league.ourId}:`, err.message);
    }
    await sleep(REQUEST_SPACING_MS);
  }
}

async function refreshFeaturedMatches() {
  try {
    const snap = await db
      .collection("matches")
      .where("status", "in", ["LIVE", "SCHEDULED"])
      .limit(20)
      .get();

    const docs = snap.docs
      .map((doc) => ({
        ref: doc.ref,
        data: doc.data(),
      }))
      .sort((a, b) => {
        const aTime = a.data?.utcDate?.toDate?.() ?? new Date(0);
        const bTime = b.data?.utcDate?.toDate?.() ?? new Date(0);
        return aTime.getTime() - bTime.getTime();
      });

    const batch = db.batch();
    docs.forEach((doc, i) => {
      batch.update(doc.ref, { isFeatured: i < 3 });
    });
    if (docs.length > 0) {
      await batch.commit();
    }
  } catch (err) {
    if (err?.code === 9 || /index/i.test(err?.message || "")) {
      console.warn("⚠️ Bỏ qua cập nhật featured matches vì Firestore cần index composite cho truy vấn này.");
      return;
    }
    throw err;
  }
}

// ─── Settle predictions cho các trận đã kết thúc ──────────────────────────
//
// Đây là mảnh còn thiếu trong toàn bộ hệ thống: mapMatchForUpsert() chỉ đặt
// `isSettled: true` trên MATCH khi trận đấu FINISHED, nhưng trước đây không
// có bất kỳ đoạn code nào đi tìm các PREDICTION đang "PENDING" của trận đó
// để tính thắng/thua, cộng/trừ coin, cập nhật thống kê. Vì vậy dự đoán của
// người dùng bị kẹt ở "Chờ kết quả" mãi mãi dù trận đã đá xong từ lâu.

function computeOutcome(score) {
  const h = score.fullTime.home;
  const a = score.fullTime.away;
  if (h === null || a === null) return null;
  if (h > a) return "HOME_WIN";
  if (a > h) return "AWAY_WIN";
  return "DRAW";
}

async function settlePendingPredictionsForMatch(matchId, matchData) {
  const actualOutcome = computeOutcome(matchData.score);
  if (!actualOutcome) return 0; // chưa có tỷ số hợp lệ, bỏ qua

  const pendingSnap = await db
    .collection("predictions")
    .where("matchId", "==", matchId)
    .where("status", "==", "PENDING")
    .get();

  if (pendingSnap.empty) return 0;

  let settledCount = 0;

  for (const predDoc of pendingSnap.docs) {
    const prediction = predDoc.data();
    const won = prediction.outcome === actualOutcome;
    const actualPayout = won ? prediction.potentialPayout : 0;
    const now = admin.firestore.Timestamp.now();
    const userRef = db.collection("users").doc(prediction.userId);

    try {
      await db.runTransaction(async (txn) => {
        const userSnap = await txn.get(userRef);
        if (!userSnap.exists) return; // tài khoản đã bị xoá, bỏ qua an toàn
        const u = userSnap.data();

        const newCorrect = (u.correctPredictions ?? 0) + (won ? 1 : 0);
        const newTotalPredictions = u.totalPredictions ?? 0; // đã +1 lúc đặt cược
        const newStreak = won ? (u.currentStreak ?? 0) + 1 : 0;
        const newBestStreak = Math.max(u.bestStreak ?? 0, newStreak);
        const newWinRate = newTotalPredictions > 0 ? newCorrect / newTotalPredictions : 0;

        txn.update(userRef, {
          coinBalance: won ? admin.firestore.FieldValue.increment(actualPayout) : u.coinBalance,
          totalEarned: won
            ? admin.firestore.FieldValue.increment(actualPayout)
            : u.totalEarned,
          totalLost: won ? u.totalLost : admin.firestore.FieldValue.increment(prediction.amount),
          correctPredictions: newCorrect,
          currentStreak: newStreak,
          bestStreak: newBestStreak,
          winRate: newWinRate,
          updatedAt: now,
        });

        const predUpdate = {
          status: won ? "WON" : "LOST",
          actualPayout,
          settledAt: now,
        };
        txn.update(predDoc.ref, predUpdate);
        // Giữ đồng bộ bản sao trong users/{uid}/predictions/{id} (app đọc
        // lịch sử cá nhân từ đây ở một vài màn hình).
        txn.update(
          db.collection("users").doc(prediction.userId).collection("predictions").doc(predDoc.id),
          predUpdate
        );

        if (won) {
          const txRef = db
            .collection("users")
            .doc(prediction.userId)
            .collection("transactions")
            .doc(`settle-${predDoc.id}`);
          txn.set(txRef, {
            type: "BET_WON",
            amount: actualPayout,
            balanceAfter: (u.coinBalance ?? 0) + actualPayout,
            reference: predDoc.id,
            description: `Thắng dự đoán — ${prediction.matchSnapshot?.homeTeam?.name ?? ""} - ${prediction.matchSnapshot?.awayTeam?.name ?? ""}`,
            createdAt: now,
          });
        }
      });
      settledCount++;
    } catch (err) {
      console.error(`  ✗ Lỗi settle prediction ${predDoc.id}:`, err.message);
    }
  }

  return settledCount;
}

async function settlePredictions() {
  console.log("\n=== Xử lý kết quả dự đoán (settle) ===");
  const finishedSnap = await db
    .collection("matches")
    .where("isSettled", "==", true)
    .limit(200)
    .get();

  let total = 0;
  for (const matchDoc of finishedSnap.docs) {
    const count = await settlePendingPredictionsForMatch(matchDoc.id, matchDoc.data());
    if (count > 0) {
      console.log(`  ✓ ${matchDoc.id}: đã xử lý ${count} dự đoán`);
      total += count;
    }
  }
  console.log(total > 0 ? `  → Tổng cộng: ${total} dự đoán đã có kết quả.` : "  (không có dự đoán nào cần xử lý)");
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  const job = process.argv[2] ?? "all"; // node sync-football-data.js [leagues|standings|matches|all]

  console.log(`Bắt đầu đồng bộ (job=${job})...`);

  if (job === "leagues" || job === "all") await syncLeagues();
  if (job === "standings" || job === "all") await syncStandings();
  if (job === "matches" || job === "all") {
    await syncMatches();
    await refreshFeaturedMatches();
    await settlePredictions();
  }

  console.log("\n✅ Hoàn tất.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Lỗi không xử lý được:", err);
  process.exit(1);
});
