import { useState, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../../services/adminService";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { getAdminQueryErrorMessage } from "../../utils/firebaseErrors";
import type { UserProfile, UserRole } from "../../types/auth.types";

type RoleFilter = "all" | "user" | "admin";
type StatusFilter = "all" | "active" | "locked";

const QUERY_KEY = ["admin", "users"];

export default function AdminUsersScreen() {
  const { user: currentAdmin } = useAuthStore();
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data: users, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: adminService.getAllUsers,
    staleTime: 30000,
  });

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pendingUid, setPendingUid] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = users ?? [];
    return list.filter((u) => {
      const matchesQuery =
        query.trim().length === 0 ||
        u.displayName?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.isActive) ||
        (statusFilter === "locked" && !u.isActive);
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  // Optimistic local patch so the list updates instantly, backed by a
  // real Firestore write.
  const patchLocal = (uid: string, patch: Partial<UserProfile>) => {
    queryClient.setQueryData<UserProfile[]>(QUERY_KEY, (prev) =>
      (prev ?? []).map((u) => (u.uid === uid ? { ...u, ...patch } : u))
    );
  };

  const handleToggleActive = (target: UserProfile) => {
    Alert.alert(
      target.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản",
      `Bạn có chắc muốn ${target.isActive ? "khóa" : "mở khóa"} tài khoản của ${target.displayName}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: target.isActive ? "Khóa" : "Mở khóa",
          style: target.isActive ? "destructive" : "default",
          onPress: async () => {
            setPendingUid(target.uid);
            try {
              await adminService.setUserActive(target.uid, !target.isActive);
              patchLocal(target.uid, { isActive: !target.isActive });
              showToast(target.isActive ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản", "success");
            } catch (e: any) {
              showToast(e?.message ?? "Không thể cập nhật. Kiểm tra quyền admin.", "error");
            } finally {
              setPendingUid(null);
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = (target: UserProfile) => {
    const nextRole: UserRole = target.role === "admin" ? "user" : "admin";
    Alert.alert(
      "Đổi vai trò",
      `Chuyển ${target.displayName} sang vai trò "${nextRole === "admin" ? "Quản trị viên" : "Người dùng"}"?` +
        (nextRole === "admin"
          ? "\n\nLưu ý: để tài khoản này thực sự có quyền ghi dữ liệu quản trị (sửa trận đấu, giải đấu...), bạn còn cần chạy scripts/set-admin-role.js với email của họ — bước này chỉ đổi giao diện hiển thị."
          : ""),
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            setPendingUid(target.uid);
            try {
              await adminService.updateUserRole(target.uid, nextRole);
              patchLocal(target.uid, { role: nextRole });
              showToast("Đã đổi vai trò", "success");
            } catch (e: any) {
              showToast(e?.message ?? "Không thể cập nhật. Kiểm tra quyền admin.", "error");
            } finally {
              setPendingUid(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingBottom: 8 }}>
        <Text style={{ color: "#0f172a", fontSize: 22, fontWeight: "700" }}>Quản lý người dùng</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#64748b", fontSize: 15 }}>← Quay lại</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <View style={{
          flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff",
          borderWidth: 1, borderColor: "#e7e9ee", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
        }}>
          <Text style={{ fontSize: 15, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={{ flex: 1, color: "#0f172a", fontSize: 14 }}
            placeholder="Tìm theo tên hoặc email..."
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Text style={{ color: "#64748b", fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
        <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>Vai trò</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          {([
            { key: "all", label: "Tất cả" },
            { key: "user", label: "Người dùng" },
            { key: "admin", label: "Quản trị" },
          ] as { key: RoleFilter; label: string }[]).map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setRoleFilter(f.key)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                backgroundColor: roleFilter === f.key ? "#14b8a6" : "#ffffff",
                borderWidth: 1, borderColor: roleFilter === f.key ? "#14b8a6" : "#e7e9ee",
              }}
            >
              <Text style={{ color: roleFilter === f.key ? "#fff" : "#64748b", fontSize: 12, fontWeight: "600" }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>Trạng thái</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {([
            { key: "all", label: "Tất cả" },
            { key: "active", label: "Đang hoạt động" },
            { key: "locked", label: "Đã khóa" },
          ] as { key: StatusFilter; label: string }[]).map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setStatusFilter(f.key)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                backgroundColor: statusFilter === f.key ? "#14b8a6" : "#ffffff",
                borderWidth: 1, borderColor: statusFilter === f.key ? "#14b8a6" : "#e7e9ee",
              }}
            >
              <Text style={{ color: statusFilter === f.key ? "#fff" : "#64748b", fontSize: 12, fontWeight: "600" }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <ErrorState
          message={getAdminQueryErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <Text style={{ color: "#94a3b8", fontSize: 12, paddingHorizontal: 16, marginBottom: 8 }}>
            {filtered.length} / {(users ?? []).length} người dùng
          </Text>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.uid}
            contentContainerStyle={{ padding: 16, paddingTop: 0 }}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: "#ffffff", borderWidth: 1,
                  borderColor: item.isActive ? "#e7e9ee" : "rgba(239,68,68,0.3)",
                  borderRadius: 14, padding: 16, marginBottom: 10,
                  opacity: pendingUid === item.uid ? 0.5 : 1,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: "#0f172a", fontSize: 15, fontWeight: "600" }}>{item.displayName}</Text>
                    <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{item.email}</Text>
                  </View>
                  <View style={{
                    backgroundColor: item.role === "admin" ? "rgba(239,68,68,0.15)" : "rgba(20,184,166,0.15)",
                    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start",
                  }}>
                    <Text style={{ color: item.role === "admin" ? "#f87171" : "#14b8a6", fontSize: 11, fontWeight: "600" }}>
                      {item.role === "admin" ? "Quản trị" : "Người dùng"}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
                  <Text style={{ color: "#64748b", fontSize: 12 }}>🪙 {(item.coinBalance ?? 0).toLocaleString()}</Text>
                  <Text style={{ color: "#64748b", fontSize: 12 }}>🎯 {item.totalPredictions ?? 0}</Text>
                  <Text style={{ color: "#64748b", fontSize: 12 }}>✓ {Math.round((item.winRate ?? 0) * 100)}%</Text>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{
                    backgroundColor: item.isActive ? "rgba(20,184,166,0.15)" : "rgba(239,68,68,0.15)",
                    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
                  }}>
                    <Text style={{ color: item.isActive ? "#14b8a6" : "#f87171", fontSize: 11, fontWeight: "600" }}>
                      {item.isActive ? "Đang hoạt động" : "Đã khóa"}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 14 }}>
                    <TouchableOpacity
                      disabled={item.uid === currentAdmin?.uid || pendingUid === item.uid}
                      onPress={() => handleChangeRole(item)}
                    >
                      <Text style={{
                        color: item.uid === currentAdmin?.uid ? "#cbd5e1" : "#14b8a6",
                        fontSize: 12, fontWeight: "600",
                      }}>
                        Đổi vai trò
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={item.uid === currentAdmin?.uid || pendingUid === item.uid}
                      onPress={() => handleToggleActive(item)}
                    >
                      <Text style={{
                        color: item.uid === currentAdmin?.uid ? "#cbd5e1" : item.isActive ? "#ef4444" : "#22c55e",
                        fontSize: 12, fontWeight: "600",
                      }}>
                        {item.isActive ? "Khóa" : "Mở khóa"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 48 }}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>🔍</Text>
                <Text style={{ color: "#64748b", fontSize: 13 }}>Không tìm thấy người dùng phù hợp</Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}
