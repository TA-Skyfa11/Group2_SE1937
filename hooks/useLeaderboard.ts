import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { leaderboardService } from "../services/leaderboardService";
import { useAuthStore } from "../store/authStore";
import { QUERY_KEYS } from "../constants/queryKeys";
import type { LeaderboardPeriod } from "../types/leaderboard.types";

export function useLeaderboard(period: LeaderboardPeriod) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = leaderboardService.subscribeToLeaderboard(period, (board) => {
      queryClient.setQueryData(QUERY_KEYS.leaderboard.period(period), board);
    });
    return unsub;
  }, [period, queryClient]);

  return useQuery({
    queryKey: QUERY_KEYS.leaderboard.period(period),
    queryFn: () => leaderboardService.getLeaderboard(period),
    staleTime: Infinity,
  });
}

export function useMyLeaderboardRank(period: LeaderboardPeriod) {
  const { firebaseUser, user } = useAuthStore();
  const uid = firebaseUser?.uid ?? user?.uid ?? "";

  return useQuery({
    queryKey: ["leaderboard-rank", period, uid],
    queryFn: () => leaderboardService.getUserRank(uid, period),
    enabled: !!uid,
    staleTime: 60000,
  });
}
