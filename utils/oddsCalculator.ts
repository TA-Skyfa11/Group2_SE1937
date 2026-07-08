import { APP_CONFIG } from "../constants/config";
import type { PredictionStats, MatchOdds } from "../types/match.types";

export interface DynamicOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export function calculateDynamicOdds(
  stats: PredictionStats,
  baseOdds: DynamicOdds
): DynamicOdds {
  const { homeWinBets, drawBets, awayWinBets } = stats;
  const total = homeWinBets + drawBets + awayWinBets;

  if (total === 0) return baseOdds;

  const M = APP_CONFIG.HOUSE_MARGIN;
  const clamp = (v: number) =>
    Math.max(APP_CONFIG.MIN_ODDS, Math.min(APP_CONFIG.MAX_ODDS, v));

  return {
    homeWin: homeWinBets > 0 ? clamp((M * total) / homeWinBets) : APP_CONFIG.MAX_ODDS,
    draw: drawBets > 0 ? clamp((M * total) / drawBets) : APP_CONFIG.MAX_ODDS,
    awayWin: awayWinBets > 0 ? clamp((M * total) / awayWinBets) : APP_CONFIG.MAX_ODDS,
  };
}

export function calculatePotentialPayout(amount: number, odds: number): number {
  return Math.floor(amount * odds);
}

export function formatOdds(value: number): string {
  return value.toFixed(2);
}
