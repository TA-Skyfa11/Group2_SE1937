import { useCallback } from "react";
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useLiveMatches, useFeaturedMatches, useUpcomingMatches } from "../../hooks/useMatches";
import { useAuthStore } from "../../store/authStore";
import { MatchCard } from "../../components/match/MatchCard";
import { CoinDisplay } from "../../components/common/CoinDisplay";
import { TeamCrest } from "../../components/common/TeamCrest";
import { formatMatchDate } from "../../utils/dateUtils";

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { data: live, isLoading: liveLoad, error: liveErr, refetch: r1 } = useLiveMatches();
  const { data: featured, isLoading: featLoad, error: featErr, refetch: r2 } = useFeaturedMatches();
  const { data: upcoming, isLoading: upLoad, error: upErr, refetch: r3 } = useUpcomingMatches();

  const onRefresh = useCallback(async () => {
    await Promise.all([r1(), r2(), r3()]);
  }, []);

  const isLoading = liveLoad && featLoad && upLoad;
  const queryError = liveErr ?? featErr ?? upErr;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#14b8a6" />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          {user ? (
            <View>
              <Text style={{ color: "#64748b", fontSize: 13 }}>Chào mừng trở lại,</Text>
              <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "700" }}>
                {user.displayName}
              </Text>
            </View>
          ) : (
            <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "700" }}>⚽ MatchPulse</Text>
          )}
          {user && <CoinDisplay />}
        </View>

        {isLoading ? (
          <View style={{ paddingTop: 80, alignItems: "center" }}>
            <ActivityIndicator color="#14b8a6" size="large" />
          </View>
        ) : (
          <>
            {/* Live matches */}
            {(live?.length ?? 0) > 0 && (
              <View style={{ marginTop: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 12, gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" }} />
                  <Text style={{ color: "#0f172a", fontSize: 16, fontWeight: "600" }}>Đang diễn ra</Text>
                  <Text style={{ color: "#64748b", fontSize: 13 }}>{live!.length} trận đấu</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                  {live!.map((match) => (
                    <TouchableOpacity
                      key={match.id}
                      onPress={() => router.push(`/match/${match.id}` as any)}
                      style={{
                        backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee",
                        borderRadius: 20, padding: 16, width: 260,
                        shadowColor: "#0f172a", shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <Text style={{ color: "#64748b", fontSize: 11 }} numberOfLines={1}>
                          {match.leagueName}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(239,68,68,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 4 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" }} />
                          <Text style={{ color: "#f87171", fontSize: 11, fontWeight: "600" }}>{match.minute}'</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <TeamCrest team={match.homeTeam} size={20} />
                          <Text style={{ color: "#0f172a", fontWeight: "600", fontSize: 13, flex: 1 }} numberOfLines={1}>
                            {match.homeTeam.shortName}
                          </Text>
                        </View>
                        <Text style={{ color: "#0f172a", fontWeight: "800", fontSize: 24, marginHorizontal: 12 }}>
                          {match.score.fullTime.home ?? 0}–{match.score.fullTime.away ?? 0}
                        </Text>
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                          <Text style={{ color: "#0f172a", fontWeight: "600", fontSize: 13, flex: 1, textAlign: "right" }} numberOfLines={1}>
                            {match.awayTeam.shortName}
                          </Text>
                          <TeamCrest team={match.awayTeam} size={20} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Featured matches */}
            {(featured?.length ?? 0) > 0 && (
              <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
                <Text style={{ color: "#0f172a", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
                  Trận đấu nổi bật
                </Text>
                {featured!.slice(0, 3).map((match) => (
                  <MatchCard key={match.id} match={match} showOdds />
                ))}
              </View>
            )}

            {/* Upcoming */}
            {(upcoming?.length ?? 0) > 0 && (
              <View style={{ marginTop: 24, paddingHorizontal: 16, marginBottom: 32 }}>
                <Text style={{ color: "#0f172a", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
                  Sắp diễn ra
                </Text>
                {upcoming!.slice(0, 8).map((match) => (
                  <MatchCard key={match.id} match={match} showOdds />
                ))}
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/search" as any)}
                  style={{ alignItems: "center", paddingVertical: 10 }}
                >
                  <Text style={{ color: "#14b8a6", fontSize: 13, fontWeight: "600" }}>
                    Xem tất cả trận đấu →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {(live?.length ?? 0) === 0 && (featured?.length ?? 0) === 0 && (upcoming?.length ?? 0) === 0 && (
              <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>{queryError ? "⚠️" : "⚽"}</Text>
                <Text style={{ color: "#0f172a", fontSize: 18, fontWeight: "600" }}>
                  {queryError ? "Không tải được trận đấu" : "Hôm nay không có trận đấu"}
                </Text>
                <Text style={{ color: "#64748b", fontSize: 14, marginTop: 8, textAlign: "center" }}>
                  {queryError
                    ? (queryError as Error).message || "Đã có lỗi xảy ra. Kéo xuống để thử lại."
                    : "Hãy quay lại sau"}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
