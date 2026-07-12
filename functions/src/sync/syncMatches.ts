import { AxiosInstance } from "axios";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../admin";
import { LEAGUE_MAPPINGS } from "../utils/leagueMap";
import { footballDataProvider, FDMatch } from "../providers/footballDataProvider";
import { mapMatchForUpsert, matchDocId } from "../utils/mapMatch";
import { sleep, REQUEST_SPACING_MS } from "../utils/sleep";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

async function upsertTeamsFromMatch(fdMatch: FDMatch, leagueOurId: string) {
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
      const leagueIds: string[] = data?.leagueIds ?? [];
      if (!leagueIds.includes(leagueOurId)) {
        batch.update(ref, {
          leagueIds: [...leagueIds, leagueOurId],
        });
        hasWrites = true;
      }
    }
  }

  if (hasWrites) await batch.commit();
}

/**
 * Syncs matches (recently finished + live + upcoming) for every supported
 * league into `matches/{matchId}`, and lazily creates `teams/{teamId}` docs
 * for any team seen for the first time.
 *
 * Window: 3 days back (to catch just-finished results) to 21 days ahead
 * (enough runway for the "Upcoming" list without re-fetching constantly).
 */
export async function syncMatches(client: AxiosInstance): Promise<void> {
  const now = new Date();
  const dateFrom = formatDate(new Date(now.getTime() - 3 * 86400_000));
  const dateTo = formatDate(new Date(now.getTime() + 21 * 86400_000));

  for (const league of LEAGUE_MAPPINGS) {
    try {
      const matches = await footballDataProvider.getMatches(
        client,
        league.code,
        dateFrom,
        dateTo
      );

      for (const fdMatch of matches) {
        const docId = matchDocId(fdMatch);
        const ref = db.collection("matches").doc(docId);
        const existing = await ref.get();
        const isFirstWrite = !existing.exists;

        const data = mapMatchForUpsert(fdMatch, league, isFirstWrite);
        await ref.set(data, { merge: true });

        await upsertTeamsFromMatch(fdMatch, league.ourId);
      }

      console.log(`[syncMatches] OK: ${league.ourId} (${matches.length} matches)`);
    } catch (err) {
      console.error(`[syncMatches] FAILED: ${league.ourId}`, err);
    }
    await sleep(REQUEST_SPACING_MS);
  }
}

/**
 * Marks isFeatured=true on up to 3 upcoming/live matches so the Home
 * screen's "Featured" section always has something to show. Simple
 * heuristic: soonest kickoff among LIVE or SCHEDULED matches.
 */
export async function refreshFeaturedMatches(): Promise<void> {
  const snap = await db
    .collection("matches")
    .where("status", "in", ["LIVE", "SCHEDULED"])
    .orderBy("utcDate", "asc")
    .limit(20)
    .get();

  const batch = db.batch();
  snap.docs.forEach((doc, i) => {
    batch.update(doc.ref, { isFeatured: i < 3 });
  });
  await batch.commit();
}
