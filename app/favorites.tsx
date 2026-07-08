import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { useFavorites } from "../hooks/useFavorites";
import { matchService } from "../services/matchService";
import { QUERY_KEYS } from "../constants/queryKeys";
import { MatchCard } from "../components/match/MatchCard";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export default function FavoritesScreen() {
  const { user } = useAuthStore();
  const { favoriteTeamIds, favoriteMatchIds, toggleTeam, toggleMatch } = useFavorites();

  const { data: favMatches, isLoading } = useQuery({
    queryKey: ["fav-matches", favoriteMatchIds],
    queryFn: async () => {
      const results = await Promise.all(
        favoriteMatchIds.map((id) => matchService.getMatchById(id))
      );
      return results.filter(Boolean);
    },
    enabled: favoriteMatchIds.length > 0,
    staleTime: 60000,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#737373", fontSize: 15 }}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>Yêu thích</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Favourite teams */}
        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 12 }}>
          Đội bóng ({favoriteTeamIds.length})
        </Text>
        {favoriteTeamIds.length === 0 ? (
          <View style={{ backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626", borderRadius: 14, padding: 20, alignItems: "center", marginBottom: 24 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🛡</Text>
            <Text style={{ color: "#737373", fontSize: 14, textAlign: "center" }}>
              Chưa có đội bóng yêu thích.{"\n"}Nhấn ❤️ trên trang đội bóng để theo dõi.
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 24 }}>
            {favoriteTeamIds.map((teamId) => (
              <View
                key={teamId}
                style={{
                  backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626",
                  borderRadius: 14, padding: 14, marginBottom: 8,
                  flexDirection: "row", alignItems: "center",
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#262626", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Text style={{ fontSize: 18 }}>🛡</Text>
                </View>
                <Text style={{ color: "#fff", flex: 1, fontSize: 14, fontWeight: "600" }}>
                  {teamId.replace("team-", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
                <TouchableOpacity onPress={() => toggleTeam(teamId)}>
                  <Text style={{ fontSize: 20 }}>❤️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Favourite matches */}
        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 12 }}>
          Trận đấu đã lưu ({favoriteMatchIds.length})
        </Text>
        {isLoading ? (
          <LoadingSpinner />
        ) : (favMatches?.length ?? 0) === 0 && favoriteMatchIds.length === 0 ? (
          <View style={{ backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626", borderRadius: 14, padding: 20, alignItems: "center", marginBottom: 24 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>⚽</Text>
            <Text style={{ color: "#737373", fontSize: 14, textAlign: "center" }}>
              Chưa có trận đấu đã lưu.{"\n"}Nhấn 🤍 trên trận đấu để lưu lại.
            </Text>
          </View>
        ) : (
          (favMatches ?? []).map((match) =>
            match ? <MatchCard key={match.id} match={match} showOdds /> : null
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
