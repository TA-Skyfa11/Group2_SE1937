import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../../services/adminService";
import { useUIStore } from "../../store/uiStore";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { getAdminQueryErrorMessage } from "../../utils/firebaseErrors";
import type { Match } from "../../types/match.types";

const QUERY_KEY = ["admin", "open-matches"];

export default function AdminOddsScreen() {
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data: matches, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: adminService.getOpenMatches,
    staleTime: 30000,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [homeOdds, setHomeOdds] = useState("");
  const [drawOdds, setDrawOdds] = useState("");
  const [awayOdds, setAwayOdds] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (matchId: string) => {
    const h = parseFloat(homeOdds);
    const d = parseFloat(drawOdds);
    const a = parseFloat(awayOdds);
    if (isNaN(h) || isNaN(d) || isNaN(a) || h < 1.05 || d < 1.05 || a < 1.05) {
      showToast("Tỷ lệ phải ≥ 1.05", "error");
      return;
    }

    setSaving(true);
    try {
      await adminService.updateMatchOdds(matchId, { homeWin: h, draw: d, awayWin: a });
      queryClient.setQueryData<Match[]>(QUERY_KEY, (prev) =>
        (prev ?? []).map((m) =>
          m.id === matchId ? { ...m, odds: { ...m.odds, homeWin: h, draw: d, awayWin: a } } : m
        )
      );
      showToast("Đã cập nhật tỷ lệ", "success");
      setEditingId(null);
    } catch (e: any) {
      showToast(e?.message ?? "Không thể cập nhật. Kiểm tra quyền admin.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
        <Text style={{ color: "#0f172a", fontSize: 22, fontWeight: "700" }}>Quản lý tỷ lệ</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#64748b", fontSize: 15 }}>← Quay lại</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ color: "#94a3b8", fontSize: 12, paddingHorizontal: 16, marginBottom: 8 }}>
        Chỉ hiện các trận còn mở dự đoán · thay đổi có hiệu lực ngay cho người dùng
      </Text>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <ErrorState
          message={getAdminQueryErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
          {(matches ?? []).length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 48 }}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>📊</Text>
              <Text style={{ color: "#64748b", fontSize: 13 }}>Không có trận nào đang mở dự đoán</Text>
            </View>
          ) : (
            (matches ?? []).map((match) => (
              <View
                key={match.id}
                style={{
                  backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee",
                  borderRadius: 16, padding: 16, marginBottom: 12,
                }}
              >
                <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>{match.leagueName}</Text>
                <Text style={{ color: "#0f172a", fontSize: 15, fontWeight: "600", marginBottom: 14 }}>
                  {match.homeTeam.name} - {match.awayTeam.name}
                </Text>

                {editingId === match.id ? (
                  <View>
                    <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
                      {[
                        { label: "Chủ nhà", value: homeOdds, set: setHomeOdds },
                        { label: "Hòa", value: drawOdds, set: setDrawOdds },
                        { label: "Khách", value: awayOdds, set: setAwayOdds },
                      ].map(({ label, value, set }) => (
                        <View key={label} style={{ flex: 1 }}>
                          <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>{label}</Text>
                          <TextInput
                            style={{
                              backgroundColor: "#e7e9ee", borderWidth: 1, borderColor: "#cbd5e1",
                              borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
                              color: "#0f172a", fontSize: 15, textAlign: "center",
                            }}
                            value={value}
                            onChangeText={set}
                            keyboardType="decimal-pad"
                            placeholder="1.80"
                            placeholderTextColor="#94a3b8"
                          />
                        </View>
                      ))}
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        disabled={saving}
                        onPress={() => setEditingId(null)}
                        style={{ flex: 1, backgroundColor: "#e7e9ee", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}
                      >
                        <Text style={{ color: "#64748b", fontWeight: "600" }}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={saving}
                        onPress={() => handleSave(match.id)}
                        style={{ flex: 1, backgroundColor: "#14b8a6", borderRadius: 10, paddingVertical: 12, alignItems: "center", opacity: saving ? 0.6 : 1 }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "700" }}>{saving ? "Đang lưu..." : "Lưu tỷ lệ"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View>
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
                      {[
                        { label: "1 Chủ", value: match.odds.homeWin },
                        { label: "X Hòa", value: match.odds.draw },
                        { label: "2 Khách", value: match.odds.awayWin },
                      ].map(({ label, value }) => (
                        <View key={label} style={{ flex: 1, backgroundColor: "#e7e9ee", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
                          <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 3 }}>{label}</Text>
                          <Text style={{ color: "#0f172a", fontWeight: "700", fontSize: 16 }}>{value.toFixed(2)}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingId(match.id);
                        setHomeOdds(match.odds.homeWin.toFixed(2));
                        setDrawOdds(match.odds.draw.toFixed(2));
                        setAwayOdds(match.odds.awayWin.toFixed(2));
                      }}
                      style={{ backgroundColor: "rgba(20,184,166,0.1)", borderWidth: 1, borderColor: "rgba(20,184,166,0.3)", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}
                    >
                      <Text style={{ color: "#14b8a6", fontWeight: "600" }}>Sửa tỷ lệ</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
