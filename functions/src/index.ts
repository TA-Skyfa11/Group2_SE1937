import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { createFootballDataClient } from "./providers/footballDataProvider";
import { syncLeagues } from "./sync/syncLeagues";
import { syncStandings } from "./sync/syncStandings";
import { syncMatches, refreshFeaturedMatches } from "./sync/syncMatches";

// Secrets — set these via:
//   firebase functions:secrets:set FOOTBALL_DATA_API_KEY
//   firebase functions:secrets:set SYNC_TRIGGER_KEY
const FOOTBALL_DATA_API_KEY = defineSecret("FOOTBALL_DATA_API_KEY");
const SYNC_TRIGGER_KEY = defineSecret("SYNC_TRIGGER_KEY");

const REGION = "asia-southeast1"; // Singapore — closest region to Vietnam

// ─── Scheduled: matches — every 10 minutes ────────────────────────────────
export const syncMatchesJob = onSchedule(
  {
    schedule: "every 10 minutes",
    region: REGION,
    secrets: [FOOTBALL_DATA_API_KEY],
    timeoutSeconds: 300,
  },
  async () => {
    const client = createFootballDataClient(FOOTBALL_DATA_API_KEY.value());
    await syncMatches(client);
    await refreshFeaturedMatches();
  }
);

// ─── Scheduled: standings — every hour ────────────────────────────────────
export const syncStandingsJob = onSchedule(
  {
    schedule: "every 60 minutes",
    region: REGION,
    secrets: [FOOTBALL_DATA_API_KEY],
    timeoutSeconds: 300,
  },
  async () => {
    const client = createFootballDataClient(FOOTBALL_DATA_API_KEY.value());
    await syncStandings(client);
  }
);

// ─── Scheduled: league metadata — once a day at 03:00 ─────────────────────
export const syncLeaguesJob = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
    secrets: [FOOTBALL_DATA_API_KEY],
    timeoutSeconds: 120,
  },
  async () => {
    const client = createFootballDataClient(FOOTBALL_DATA_API_KEY.value());
    await syncLeagues(client);
  }
);

// ─── Manual trigger (HTTP) — for testing without waiting for the schedule ─
// Call: https://<region>-<project-id>.cloudfunctions.net/manualSync?key=YOUR_SYNC_TRIGGER_KEY&job=all
// job = "leagues" | "standings" | "matches" | "all" (default: all)
export const manualSync = onRequest(
  {
    region: REGION,
    secrets: [FOOTBALL_DATA_API_KEY, SYNC_TRIGGER_KEY],
    timeoutSeconds: 300,
  },
  async (req, res) => {
    if (req.query.key !== SYNC_TRIGGER_KEY.value()) {
      res.status(401).json({ error: "Unauthorized. Missing or wrong ?key=" });
      return;
    }

    const job = (req.query.job as string) ?? "all";
    const client = createFootballDataClient(FOOTBALL_DATA_API_KEY.value());

    try {
      if (job === "leagues" || job === "all") await syncLeagues(client);
      if (job === "standings" || job === "all") await syncStandings(client);
      if (job === "matches" || job === "all") {
        await syncMatches(client);
        await refreshFeaturedMatches();
      }
      res.status(200).json({ ok: true, job });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[manualSync] error:", message);
      res.status(500).json({ ok: false, error: message });
    }
  }
);
