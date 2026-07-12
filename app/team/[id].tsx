import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { teamService } from "../../services/teamService";
import { matchService } from "../../services/matchService";
import { QUERY_KEYS } from "../../constants/queryKeys";
import { useFavorites } from "../../hooks/useFavorites";
import { MatchCard } from "../../components/match/MatchCard";
import { EmptyState } from "../../components/ui/EmptyState";

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isTeamFavorite, toggleTeam } = useFavorites();

  const { data: team, isLoading: teamLoad } = useQuery({
    queryKey: QUERY_KEYS.teams.byId(id ?? ""),
    queryFn: () => teamService.getTeamById(id ?? ""),
    enabled: !!id,
  });

  const { data: players, isLoading: playersLoad } = useQuery({
    queryKey: QUERY_KEYS.teams.players(id ?? ""),
    queryFn: () => teamService.getTeamPlayers(id ?? ""),
    enabled: !!id,
  });

  const isFav = isTeamFavorite(id ?? "");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }}>
      {/* Top bar */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#64748b", fontSize: 15 }}>← Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => id && toggleTeam(id)}>
          <Text style={{ fontSize: 22 }}>{isFav ? "❤️" : "🤍"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {teamLoad ? (
          <ActivityIndicator color="#14b8a6" style={{ marginTop: 60 }} />
        ) : !team ? (
          <EmptyState icon="🛡" title="Không tìm thấy đội bóng" />
        ) : (
          <>
            {/* Team header */}
            <View style={{ alignItems: "center", padding: 24 }}>
              <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                {team.crest ? (
                  <Image source={{ uri: team.crest }} style={{ width: 60, height: 60 }} resizeMode="contain" />
                ) : (
                  <Text style={{ fontSize: 28, fontWeight: "700", color: "#94a3b8" }}>
                    {team.tla?.slice(0, 2) || "?"}
                  </Text>
                )}
              </View>
              <Text style={{ color: "#0f172a", fontSize: 24, fontWeight: "700" }}>{team.name}</Text>
              <Text style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{team.country}</Text>
              {team.venue && (
                <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>📍 {team.venue.name}, {team.venue.city}</Text>
              )}
            </View>

            {/* Info grid */}
            <View style={{ marginHorizontal: 16, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
              {[
                [
                  { label: "Tên viết tắt", value: team.shortName },
                  { label: "Mã đội", value: team.tla },
                ],
                [
                  { label: "Quốc gia", value: team.country },
                  { label: "Người theo dõi", value: team.followerCount.toLocaleString() },
                ],
                team.venue
                  ? [
                      { label: "Sân vận động", value: team.venue.name },
                      { label: "Sức chứa", value: team.venue.capacity.toLocaleString() },
                    ]
                  : null,
              ]
                .filter(Boolean)
                .map((row, ri) => (
                  <View key={ri} style={{ flexDirection: "row", borderTopWidth: ri > 0 ? 1 : 0, borderTopColor: "#e7e9ee" }}>
                    {(row as any[]).map(({ label, value }: any, ci: number) => (
                      <View key={ci} style={{ flex: 1, padding: 14, borderLeftWidth: ci > 0 ? 1 : 0, borderLeftColor: "#e7e9ee" }}>
                        <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>{label}</Text>
                        <Text style={{ color: "#0f172a", fontSize: 14, fontWeight: "600" }}>{value}</Text>
                      </View>
                    ))}
                  </View>
                ))}
            </View>

            {/* Squad */}
            <View style={{ marginHorizontal: 16, marginBottom: 48 }}>
              <Text style={{ color: "#0f172a", fontSize: 17, fontWeight: "700", marginBottom: 12 }}>Danh sách cầu thủ</Text>
              {playersLoad ? (
                <ActivityIndicator color="#14b8a6" />
              ) : (players?.length ?? 0) === 0 ? (
                <EmptyState icon="👥" title="Chưa có dữ liệu cầu thủ" subtitle="Thông tin cầu thủ hiện chưa có sẵn" />
              ) : (
                players!.map((p) => (
                  <View
                    key={p.id}
                    style={{
                      backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee",
                      borderRadius: 12, padding: 14, marginBottom: 8,
                      flexDirection: "row", alignItems: "center",
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#e7e9ee", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                      <Text style={{ color: "#64748b", fontSize: 13, fontWeight: "700" }}>
                        {p.shirtNumber ?? "?"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#0f172a", fontSize: 14, fontWeight: "600" }}>{p.name}</Text>
                      <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{p.position} · {p.nationality}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ color: "#64748b", fontSize: 11 }}>⚽ {p.stats.goals} 🎯 {p.stats.assists}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
