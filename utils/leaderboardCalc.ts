export function calculateLeaderboardScore(params: {
  coinBalance: number;
  winRate: number;
  totalPredictions: number;
  currentStreak: number;
}): number {
  const { coinBalance, winRate, totalPredictions, currentStreak } = params;
  return Math.round(
    coinBalance * 0.4 +
      winRate * 1000 * 0.3 +
      totalPredictions * 2 * 0.15 +
      currentStreak * 50 * 0.15
  );
}

export function formatScore(score: number): string {
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1)}M`;
  if (score >= 1_000) return `${(score / 1_000).toFixed(1)}K`;
  return score.toString();
}

export function getRankEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export function getStreakDisplay(streak: number): string {
  if (streak === 0) return "-";
  return `🔥 ${streak}`;
}
