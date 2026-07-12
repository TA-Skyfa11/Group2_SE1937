/**
 * Small delay between successive football-data.org calls so a sync loop
 * over multiple leagues never bursts past the free-tier limit of
 * 10 requests/minute. 7s spacing = max ~8.5 req/min, safely under the cap.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const REQUEST_SPACING_MS = 7_000;
