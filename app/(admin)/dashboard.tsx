import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { adminService } from "../../services/adminService";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { getAdminQueryErrorMessage } from "../../utils/firebaseErrors";

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Chưa diễn ra",
  LIVE: "Trực tiếp",
  PAUSED: "Nghỉ giữa trận",
  FINISHED: "Kết thúc",
  POSTPONED: "Tạm hoãn",
  CANCELLED: "Đã hủy",
};

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const statsQuery = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: adminService.getDashboardStats,
    staleTime: 30000,
  });
  const recentQuery = useQuery({
    queryKey: ["admin", "recent-matches"],
    queryFn: () => adminService.getRecentMatches(5),
    staleTime: 30000,
  });

  const isLoading = statsQuery.isLoading || recentQuery.isLoading;
  const isError = statsQuery.isError || recentQuery.isError;
  const queryError = statsQuery.error ?? recentQuery.error;

  const stats = statsQuery.data
    ? [
        { label: "Tổng người dùng", value: statsQuery.data.totalUsers, icon: "👥" },
        { label: "Đang diễn ra", value: statsQuery.data.liveCount, icon: "🔴" },
        { label: "Chưa diễn ra", value: statsQuery.data.scheduledCount, icon: "📅" },
        { label: "Tổng dự đoán", value: statsQuery.data.totalPredictions, icon: "🎯" },
      ]
    : [];

  const actions = [
    { label: "Quản lý người dùng", icon: "👥", route: "/(admin)/users" },
    { label: "Quản lý tỷ lệ", icon: "📊", route: "/(admin)/odds" },
    { label: "Quản lý coin", icon: "🪙", route: "/(admin)/coins" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 16, paddingTop: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: "#0f172a", fontSize: 24, fontWeight: "700" }}>Trang quản trị</Text>
            <Text style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>
              Chào, {user?.displayName}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: "#64748b", fontSize: 15 }}>← Quay lại</Text>
          </TouchableOpacity>
        </View>

        {/* Admin badge */}
        <View style={{ marginHorizontal: 16, marginBottom: 20, backgroundColor: "rgba(20,184,166,0.1)", borderWidth: 1, borderColor: "rgba(20,184,166,0.3)", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
          <View>
            <Text style={{ color: "#14b8a6", fontWeight: "600", fontSize: 14 }}>Đã bật quyền quản trị</Text>
            <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
              Bạn có toàn quyền kiểm soát hệ thống
            </Text>
          </View>
        </View>

        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <View style={{ paddingHorizontal: 16 }}>
            <ErrorState
              message={getAdminQueryErrorMessage(queryError)}
              onRetry={() => {
                statsQuery.refetch();
                recentQuery.refetch();
              }}
            />
          </View>
        ) : (
          <>
            {/* Stats grid */}
            <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
              <Text style={{ color: "#0f172a", fontSize: 17, fontWeight: "700", marginBottom: 12 }}>
                Tổng quan hệ thống
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {stats.map(({ label, value, icon }) => (
                  <View
                    key={label}
                    style={{
                      width: "47%", backgroundColor: "#ffffff",
                      borderWidth: 1, borderColor: "#e7e9ee",
                      borderRadius: 14, padding: 16,
                    }}
                  >
                    <Text style={{ fontSize: 24, marginBottom: 8 }}>{icon}</Text>
                    <Text style={{ color: "#0f172a", fontSize: 22, fontWeight: "700" }}>{value}</Text>
                    <Text style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Recent matches */}
            <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
              <Text style={{ color: "#0f172a", fontSize: 17, fontWeight: "700", marginBottom: 12 }}>
                Trận đấu gần đây
              </Text>
              {(recentQuery.data ?? []).length === 0 ? (
                <Text style={{ color: "#94a3b8", fontSize: 13 }}>Chưa có trận đấu nào trong hệ thống.</Text>
              ) : (
                (recentQuery.data ?? []).map((match) => (
                  <View
                    key={match.id}
                    style={{
                      backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee",
                      borderRadius: 12, padding: 14, marginBottom: 8,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ color: "#64748b", fontSize: 11 }}>{match.leagueName}</Text>
                      <View style={{
                        backgroundColor: match.status === "LIVE" ? "rgba(239,68,68,0.15)" :
                          match.status === "FINISHED" ? "rgba(115,115,115,0.15)" : "rgba(20,184,166,0.15)",
                        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
                      }}>
                        <Text style={{
                          fontSize: 11, fontWeight: "600",
                          color: match.status === "LIVE" ? "#ef4444" :
                            match.status === "FINISHED" ? "#64748b" : "#14b8a6",
                        }}>
                          {STATUS_LABEL[match.status] ?? match.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: "#0f172a", fontSize: 14, fontWeight: "600" }}>
                      {match.homeTeam.name} - {match.awayTeam.name}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                      <Text style={{ color: "#64748b", fontSize: 12 }}>
                        🎯 {match.predictionStats.totalBets} dự đoán
                      </Text>
                      <Text style={{ color: "#64748b", fontSize: 12 }}>
                        🪙 {match.predictionStats.totalCoinsWagered.toLocaleString()} coin đã cược
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {/* Quick actions */}
        <View style={{ paddingHorizontal: 16, marginBottom: 48 }}>
          <Text style={{ color: "#0f172a", fontSize: 17, fontWeight: "700", marginBottom: 12 }}>
            Thao tác nhanh
          </Text>
          {actions.map(({ label, icon, route }) => (
            <TouchableOpacity
              key={label}
              onPress={() => router.push(route as any)}
              style={{
                backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee",
                borderRadius: 14, padding: 16, marginBottom: 8,
                flexDirection: "row", alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 22, marginRight: 14 }}>{icon}</Text>
              <Text style={{ color: "#0f172a", flex: 1, fontSize: 15, fontWeight: "500" }}>{label}</Text>
              <Text style={{ color: "#cbd5e1", fontSize: 20 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
