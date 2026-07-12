import { AxiosInstance } from "axios";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../admin";
import { LEAGUE_MAPPINGS } from "../utils/leagueMap";
import { footballDataProvider } from "../providers/footballDataProvider";
import { sleep, REQUEST_SPACING_MS } from "../utils/sleep";

/**
 * Syncs the standings table for each league into
 * `leagues/{leagueId}/standings/{doc}`. The client always reads the most
 * recent doc (ordered by lastUpdated desc), so we always write a doc with
 * a fixed id "current" and just overwrite it — no need to keep history.
 */
export async function syncStandings(client: AxiosInstance): Promise<void> {
  for (const league of LEAGUE_MAPPINGS) {
    try {
      const response = await footballDataProvider.getStandings(
        client,
        league.code
      );

      const totalTable = response.standings.find((s) => s.type === "TOTAL");
      if (!totalTable) {
        console.warn(`[syncStandings] No TOTAL table for ${league.ourId}`);
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
          lastUpdated: Timestamp.now(),
        });

      console.log(`[syncStandings] OK: ${league.ourId} (${table.length} teams)`);
    } catch (err) {
      console.error(`[syncStandings] FAILED: ${league.ourId}`, err);
    }
    await sleep(REQUEST_SPACING_MS);
  }
}
