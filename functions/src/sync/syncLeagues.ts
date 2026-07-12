import { AxiosInstance } from "axios";
import { db } from "../admin";
import { LEAGUE_MAPPINGS } from "../utils/leagueMap";
import { footballDataProvider } from "../providers/footballDataProvider";
import { Timestamp } from "firebase-admin/firestore";
import { sleep, REQUEST_SPACING_MS } from "../utils/sleep";

/**
 * Syncs the 5 supported leagues' basic metadata into `leagues/{leagueId}`.
 * Leagues rarely change, so this only needs to run once a day.
 */
export async function syncLeagues(client: AxiosInstance): Promise<void> {
  for (const league of LEAGUE_MAPPINGS) {
    try {
      const competition = await footballDataProvider.getCompetition(
        client,
        league.code
      );

      await db
        .collection("leagues")
        .doc(league.ourId)
        .set(
          {
            name: league.name,
            shortName: league.shortName,
            country: league.country,
            logo: competition.emblem ?? "",
            type: league.type,
            currentSeasonId: `${league.ourId}-current`,
            externalId: league.code,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );

      console.log(`[syncLeagues] OK: ${league.ourId}`);
    } catch (err) {
      console.error(`[syncLeagues] FAILED: ${league.ourId}`, err);
    }
    await sleep(REQUEST_SPACING_MS);
  }
}
