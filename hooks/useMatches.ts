import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { matchService } from "../services/matchService";
import { QUERY_KEYS } from "../constants/queryKeys";
import { APP_CONFIG } from "../constants/config";

export function useLiveMatches() {
  return useQuery({
    queryKey: QUERY_KEYS.matches.live,
    queryFn: () => matchService.getLiveMatches(),
    refetchInterval: APP_CONFIG.LIVE_REFETCH_INTERVAL,
    staleTime: 0,
  });
}

export function useFeaturedMatches() {
  return useQuery({
    queryKey: QUERY_KEYS.matches.featured,
    queryFn: () => matchService.getFeaturedMatches(),
    staleTime: 60000,
  });
}

export function useUpcomingMatches(limitCount = 20) {
  return useQuery({
    queryKey: [...QUERY_KEYS.matches.upcoming, limitCount],
    queryFn: () => matchService.getUpcomingMatches(limitCount),
    staleTime: APP_CONFIG.UPCOMING_STALE_TIME,
  });
}

export function useMatchesByLeague(leagueId: string) {
  return useQuery({
    queryKey: ["matches", "league", leagueId],
    queryFn: () => matchService.getMatchesByLeague(leagueId),
    enabled: !!leagueId,
    staleTime: 60000,
  });
}

export function useMatchById(matchId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.matches.byId(matchId),
    queryFn: () => matchService.getMatchById(matchId),
    enabled: !!matchId,
    staleTime: 15000,
  });
}

export function useMatchEvents(matchId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.matches.events(matchId),
    queryFn: () => matchService.getMatchEvents(matchId),
    enabled: !!matchId,
    staleTime: 30000,
  });
}

export function useLiveMatch(matchId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!matchId) return;
    const unsub = matchService.subscribeToMatch(matchId, (match) => {
      queryClient.setQueryData(QUERY_KEYS.matches.byId(matchId), match);
    });
    return unsub;
  }, [matchId, queryClient]);

  return useQuery({
    queryKey: QUERY_KEYS.matches.byId(matchId),
    queryFn: () => matchService.getMatchById(matchId),
    enabled: !!matchId,
    staleTime: Infinity,
  });
}
