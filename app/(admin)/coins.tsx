import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../../services/adminService";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { getAdminQueryErrorMessage } from "../../utils/firebaseErrors";
import type { UserProfile } from "../../types/auth.types";

const QUERY_KEY = ["admin", "users"];

export default function AdminCoinsScreen() {
  const { user: currentAdmin } = useAuthStore();
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data: users, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: adminService.getAllUsers,
    staleTime: 30000,
  });

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdjust = async (uid: string, displayName: string) => {
    const val = parseInt(amount, 10);
    if (isNaN(val) || val === 0) {
      showToast("Vui lòng nhập số hợp lệ", "error");
      return;
    }

    setSaving(true);
    try {
      const newBalance = await adminService.adjustUserCoins(
        uid,
        val,
        reason,
        currentAdmin?.displayName ?? "Admin"
      );
      queryClient.setQueryData<UserProfile[]>(QUERY_KEY, (prev) =>
        (prev ?? []).map((u) => (u.uid === uid ? { ...u, coinBalance: newBalance } : u))
      );
      showToast(
        `${val > 0 ? "+" : ""}${val} coin đã được ${val > 0 ? "cộng cho" : "trừ của"} ${displayName}`,
        "success"
      );
      setSelectedUser(null);
      setAmount("");
      setReason("");
    } catch (e: any) {
      showToast(e?.message ?? "Không thể điều chỉnh. Kiểm tra quyền admin.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
        <Text style={{ color: "#0f172a", fontSize: 22, fontWeight: "700" }}>Quản lý coin</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#64748b", fontSize: 15 }}>← Quay lại</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <ErrorState
          message={getAdminQueryErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <Text style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
            Chọn một người dùng để điều chỉnh số dư coin của họ.
          </Text>

          {(users ?? []).length === 0 ? (
            <Text style={{ color: "#94a3b8", fontSize: 13 }}>Chưa có người dùng nào.</Text>
          ) : (
            (users ?? []).map((entry) => (
              <View
                key={entry.uid}
                style={{
                  backgroundColor: "#ffffff", borderWidth: 1,
                  borderColor: selectedUser === entry.uid ? "#14b8a6" : "#e7e9ee",
                  borderRadius: 14, padding: 16, marginBottom: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedUser(selectedUser === entry.uid ? null : entry.uid)}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={{ color: "#0f172a", fontSize: 15, fontWeight: "600" }}>{entry.displayName}</Text>
                      <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                        🪙 {(entry.coinBalance ?? 0).toLocaleString()} coin
                      </Text>
                    </View>
                    <Text style={{ color: selectedUser === entry.uid ? "#14b8a6" : "#cbd5e1", fontSize: 20 }}>
                      {selectedUser === entry.uid ? "▲" : "▼"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {selectedUser === entry.uid && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 8 }}>
                      Số lượng (dương để cộng, âm để trừ)
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: "#e7e9ee", borderWidth: 1, borderColor: "#cbd5e1",
                        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                        color: "#0f172a", fontSize: 15, marginBottom: 10,
                      }}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numbers-and-punctuation"
                      placeholder="+500 hoặc -200"
                      placeholderTextColor="#94a3b8"
                    />
                    <TextInput
                      style={{
                        backgroundColor: "#e7e9ee", borderWidth: 1, borderColor: "#cbd5e1",
                        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                        color: "#0f172a", fontSize: 14, marginBottom: 12,
                      }}
                      value={reason}
                      onChangeText={setReason}
                      placeholder="Lý do (không bắt buộc)"
                      placeholderTextColor="#94a3b8"
                    />
                    <TouchableOpacity
                      disabled={saving}
                      onPress={() => handleAdjust(entry.uid, entry.displayName)}
                      style={{
                        backgroundColor: "#14b8a6", borderRadius: 10, paddingVertical: 12,
                        alignItems: "center", opacity: saving ? 0.6 : 1,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                        {saving ? "Đang xử lý..." : "Xác nhận điều chỉnh"}
                      </Text>
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
