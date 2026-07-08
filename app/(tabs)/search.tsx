import { useState, useCallback } from "react";
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { matchService } from "../../services/matchService";
import { leagueService } from "../../services/leagueService";
import { teamService } from "../../services/teamService";
import { MOCK_MATCHES, MOCK_LEAGUES } from "../../constants/mockData";

function useSearch(term: string) {
  return useQuery({
    queryKey: ["search", term],
    queryFn: async () => {
      if (term.length < 2) return { matches: [], leagues: [], teams: [] };
      const t = term.toLowerCase();
      const matches = MOCK_MATCHES.filter(
        (m) =>
          m.homeTeam.name.toLowerCase().includes(t) ||
          m.awayTeam.name.toLowerCase().includes(t) ||
          m.leagueName.toLowerCase().includes(t)
      );
      const leagues = MOCK_LEAGUES.filter(
        (l) => l.name.toLowerCase().includes(t) || l.country.toLowerCase().includes(t)
      );
      return { matches, leagues, teams: [] };
    },
    enabled: term.length >= 2,
    staleTime: 30000,
  });
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useSearch(query);

  const hasResults =
    (data?.matches.length ?? 0) > 0 || (data?.leagues.length ?? 0) > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 12 }}>Tìm kiếm</Text>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
          <Text style={{ fontSize: 16, marginRight: 10 }}>🔍</Text>
          <TextInput
            style={{ flex: 1, color: "#fff", fontSize: 15 }}
            placeholder="Đội bóng, giải đấu, trận đấu..."
            placeholderTextColor="#525252"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Text style={{ color: "#737373", fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {query.length < 2 ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>Tìm kiếm bóng đá</Text>
            <Text style={{ color: "#737373", fontSize: 14, marginTop: 8, textAlign: "center" }}>
              Tìm đội bóng, giải đấu hoặc trận đấu
            </Text>
          </View>
        ) : isLoading ? (
          <ActivityIndicator color="#14b8a6" style={{ marginTop: 40 }} />
        ) : !hasResults ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🤷</Text>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>Không có kết quả</Text>
            <Text style={{ color: "#737373", fontSize: 14, marginTop: 8 }}>
              Hãy thử từ khóa khác
            </Text>
          </View>
        ) : (
          <>
            {/* Matches */}
            {(data?.matches.length ?? 0) > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: "#737373", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Trận đấu
                </Text>
                {data!.matches.map((match) => (
                  <TouchableOpacity
                    key={match.id}
                    onPress={() => router.push(`/match/${match.id}` as any)}
                    style={{
                      backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626",
                      borderRadius: 12, padding: 14, marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: "#737373", fontSize: 11, marginBottom: 4 }}>{match.leagueName}</Text>
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                      {match.homeTeam.name} vs {match.awayTeam.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Leagues */}
            {(data?.leagues.length ?? 0) > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: "#737373", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Giải đấu
                </Text>
                {data!.leagues.map((league) => (
                  <TouchableOpacity
                    key={league.id}
                    onPress={() => router.push(`/league/${league.id}` as any)}
                    style={{
                      backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626",
                      borderRadius: 12, padding: 14, marginBottom: 8,
                      flexDirection: "row", alignItems: "center", gap: 12,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>🏆</Text>
                    <View>
                      <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>{league.name}</Text>
                      <Text style={{ color: "#737373", fontSize: 12, marginTop: 2 }}>{league.country}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
