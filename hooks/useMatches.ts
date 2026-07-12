import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { matchService } from "../services/matchService";
import { QUERY_KEYS } from "../constants/queryKeys";
import { APP_CONFIG } from "../constants/config";

export function useLiveMatches() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Real-time push instead of polling: Firestore only sends data over
    // the wire when a LIVE match doc actually changes (e.g. the sync
    // Cloud Function writes a new score/minute), instead of re-running a
    // full query every 30s regardless of whether anything changed. This
    // is both more resource-efficient (fewer reads billed, less battery/
    // network on the phone) AND more "real-time" (no up-to-30s lag).
    const unsub = matchService.subscribeToLiveMatches((matches) => {
      queryClient.setQueryData(QUERY_KEYS.matches.live, matches);
    });
    return unsub;
  }, [queryClient]);

  return useQuery({
    queryKey: QUERY_KEYS.matches.live,
    queryFn: () => matchService.getLiveMatches(),
    staleTime: Infinity, // the onSnapshot listener above is the source of truth once mounted
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
