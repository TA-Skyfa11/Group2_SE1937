import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { leagueService } from "../../services/leagueService";
import { QUERY_KEYS } from "../../constants/queryKeys";
import type { League, Standing } from "../../types/league.types";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { EmptyState } from "../../components/ui/EmptyState";

function StandingsTable({ standing }: { standing: Standing }) {
  return (
    <View style={{ marginTop: 8 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#262626" }}>
        <Text style={{ color: "#737373", fontSize: 11, width: 28 }}>#</Text>
        <Text style={{ color: "#737373", fontSize: 11, flex: 1 }}>Đội</Text>
        <Text style={{ color: "#737373", fontSize: 11, width: 28, textAlign: "center" }}>P</Text>
        <Text style={{ color: "#737373", fontSize: 11, width: 28, textAlign: "center" }}>W</Text>
        <Text style={{ color: "#737373", fontSize: 11, width: 28, textAlign: "center" }}>D</Text>
        <Text style={{ color: "#737373", fontSize: 11, width: 28, textAlign: "center" }}>L</Text>
        <Text style={{ color: "#737373", fontSize: 11, width: 36, textAlign: "center" }}>Pts</Text>
      </View>
      {standing.table.map((row, i) => (
        <View
          key={row.teamId}
          style={{
            flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10,
            alignItems: "center",
            borderBottomWidth: 0.5, borderBottomColor: "#1a1a1a",
            backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
          }}
        >
          <Text style={{
            color: row.position <= 4 ? "#14b8a6" : row.position >= standing.table.length - 2 ? "#ef4444" : "#737373",
            fontSize: 12, fontWeight: "600", width: 28,
          }}>
            {row.position}
          </Text>
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "500", flex: 1 }} numberOfLines={1}>
            {row.teamName}
          </Text>
          <Text style={{ color: "#a3a3a3", fontSize: 12, width: 28, textAlign: "center" }}>{row.playedGames}</Text>
          <Text style={{ color: "#a3a3a3", fontSize: 12, width: 28, textAlign: "center" }}>{row.won}</Text>
          <Text style={{ color: "#a3a3a3", fontSize: 12, width: 28, textAlign: "center" }}>{row.draw}</Text>
          <Text style={{ color: "#a3a3a3", fontSize: 12, width: 28, textAlign: "center" }}>{row.lost}</Text>
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", width: 36, textAlign: "center" }}>{row.points}</Text>
        </View>
      ))}
    </View>
  );
}

function LeagueSection({ league }: { league: League }) {
  const [expanded, setExpanded] = useState(false);
  const { data: standing, isLoading } = useQuery({
    queryKey: QUERY_KEYS.leagues.standings(league.id),
    queryFn: () => leagueService.getStandings(league.id),
    enabled: expanded,
    staleTime: 300000,
  });

  return (
    <View style={{ backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626", borderRadius: 16, marginBottom: 12, overflow: "hidden" }}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: "row", alignItems: "center", padding: 16 }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#262626", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
          <Text style={{ fontSize: 20 }}>🏆</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>{league.name}</Text>
          <Text style={{ color: "#737373", fontSize: 12, marginTop: 2 }}>{league.country}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => router.push(`/league/${league.id}` as any)}>
            <Text style={{ color: "#14b8a6", fontSize: 12 }}>Trận đấu</Text>
          </TouchableOpacity>
          <Text style={{ color: "#525252", fontSize: 18 }}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: "#262626" }}>
          {isLoading ? (
            <ActivityIndicator color="#14b8a6" style={{ paddingVertical: 20 }} />
          ) : standing ? (
            <StandingsTable standing={standing} />
          ) : (
            <Text style={{ color: "#737373", textAlign: "center", padding: 16, fontSize: 13 }}>
              Chưa có bảng xếp hạng
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function LeaguesScreen() {
  const { data: leagues, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.leagues.all,
    queryFn: () => leagueService.getAllLeagues(),
    staleTime: 300000,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700" }}>Giải đấu</Text>
        <Text style={{ color: "#737373", fontSize: 13, marginTop: 4 }}>
          Bảng xếp hạng & lịch đấu
        </Text>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : error ? (
        <EmptyState icon="⚠️" title="Không thể tải giải đấu" subtitle="Kéo để làm mới" />
      ) : (leagues?.length ?? 0) === 0 ? (
        <EmptyState icon="🏆" title="Không tìm thấy giải đấu" />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {leagues!.map((league) => (
            <LeagueSection key={league.id} league={league} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
