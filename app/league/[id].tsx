import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { leagueService } from "../../services/leagueService";
import { matchService } from "../../services/matchService";
import { QUERY_KEYS } from "../../constants/queryKeys";
import { MatchCard } from "../../components/match/MatchCard";
import { EmptyState } from "../../components/ui/EmptyState";
import type { StandingRow } from "../../types/league.types";

type Tab = "matches" | "standings";

export default function LeagueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("matches");

  const { data: league, isLoading: leagueLoad } = useQuery({
    queryKey: QUERY_KEYS.leagues.byId(id ?? ""),
    queryFn: () => leagueService.getLeagueById(id ?? ""),
    enabled: !!id,
  });

  const { data: matches, isLoading: matchesLoad } = useQuery({
    queryKey: ["matches", "league", id],
    queryFn: () => matchService.getMatchesByLeague(id ?? ""),
    enabled: !!id && tab === "matches",
    staleTime: 60000,
  });

  const { data: standing, isLoading: standingLoad } = useQuery({
    queryKey: QUERY_KEYS.leagues.standings(id ?? ""),
    queryFn: () => leagueService.getStandings(id ?? ""),
    enabled: !!id && tab === "standings",
    staleTime: 300000,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      {/* Back + header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 14 }}>
          <Text style={{ color: "#737373", fontSize: 15 }}>← Quay lại</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 32 }}>🏆</Text>
          <View>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
              {leagueLoad ? "Đang tải..." : league?.name ?? "Giải đấu"}
            </Text>
            <Text style={{ color: "#737373", fontSize: 13 }}>
              {league?.country ?? ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
        {([
          { key: "matches" as Tab, label: "Trận đấu" },
          { key: "standings" as Tab, label: "Bảng xếp hạng" },
        ]).map(({ key: t, label }) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
              backgroundColor: tab === t ? "#14b8a6" : "#171717",
              borderWidth: 1, borderColor: tab === t ? "#14b8a6" : "#262626",
            }}
          >
            <Text style={{ color: tab === t ? "#fff" : "#737373", fontSize: 14, fontWeight: "600" }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "matches" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {matchesLoad ? (
            <ActivityIndicator color="#14b8a6" style={{ marginTop: 40 }} />
          ) : (matches?.length ?? 0) === 0 ? (
            <EmptyState icon="⚽" title="Không có trận đấu nào" />
          ) : (
            matches!.map((match) => <MatchCard key={match.id} match={match} showOdds />)
          )}
        </ScrollView>
      )}

      {tab === "standings" && (
        <ScrollView style={{ flex: 1 }}>
          {standingLoad ? (
            <ActivityIndicator color="#14b8a6" style={{ marginTop: 40 }} />
          ) : !standing ? (
            <EmptyState icon="📊" title="Chưa có bảng xếp hạng" />
          ) : (
            <View style={{ paddingBottom: 48 }}>
              {/* Header row */}
              <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#262626" }}>
                <Text style={{ color: "#737373", fontSize: 11, width: 30 }}>#</Text>
                <Text style={{ color: "#737373", fontSize: 11, flex: 1 }}>Đội</Text>
                {["P", "W", "D", "L", "GD", "Pts"].map((h) => (
                  <Text key={h} style={{ color: "#737373", fontSize: 11, width: 30, textAlign: "center" }}>{h}</Text>
                ))}
              </View>
              {standing.table.map((row: StandingRow, i: number) => (
                <View
                  key={row.teamId}
                  style={{
                    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12,
                    alignItems: "center",
                    borderBottomWidth: 0.5, borderBottomColor: "#1a1a1a",
                    backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  }}
                >
                  <Text style={{
                    fontSize: 12, fontWeight: "700", width: 30,
                    color: row.position <= 4 ? "#14b8a6" : row.position >= standing.table.length - 2 ? "#ef4444" : "#737373",
                  }}>
                    {row.position}
                  </Text>
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "500", flex: 1 }} numberOfLines={1}>
                    {row.teamName}
                  </Text>
                  {[row.playedGames, row.won, row.draw, row.lost, row.goalDifference].map((val, vi) => (
                    <Text key={vi} style={{ color: "#a3a3a3", fontSize: 12, width: 30, textAlign: "center" }}>
                      {val > 0 && vi === 4 ? `+${val}` : val}
                    </Text>
                  ))}
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", width: 30, textAlign: "center" }}>
                    {row.points}
                  </Text>
                </View>
              ))}
              {/* Legend */}
              <View style={{ padding: 16, gap: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#14b8a6" }} />
                  <Text style={{ color: "#737373", fontSize: 11 }}>Vòng loại Cúp C1</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#ef4444" }} />
                  <Text style={{ color: "#737373", fontSize: 11 }}>Khu vực xuống hạng</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
