import { useState, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MOCK_USERS, MockUser } from "../../constants/mockData";

type RoleFilter = "all" | "user" | "admin";
type StatusFilter = "all" | "active" | "locked";

export default function AdminUsersScreen() {
  // Local copy of the mutable mock array so the screen re-renders on change.
  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery =
        query.trim().length === 0 ||
        u.displayName.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.isActive) ||
        (statusFilter === "locked" && !u.isActive);
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const applyChange = (uid: string, patch: Partial<MockUser>) => {
    setUsers((prev) => {
      const next = prev.map((u) => (u.uid === uid ? { ...u, ...patch } : u));
      // Mutate the shared module-level array too so the change is reflected
      // if the admin navigates away and back within the same app session.
      const idx = MOCK_USERS.findIndex((u) => u.uid === uid);
      if (idx !== -1) MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...patch };
      return next;
    });
  };

  const handleToggleActive = (user: MockUser) => {
    Alert.alert(
      user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản",
      `Bạn có chắc muốn ${user.isActive ? "khóa" : "mở khóa"} tài khoản của ${user.displayName}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: user.isActive ? "Khóa" : "Mở khóa",
          style: user.isActive ? "destructive" : "default",
          onPress: () => applyChange(user.uid, { isActive: !user.isActive }),
        },
      ]
    );
  };

  const handleChangeRole = (user: MockUser) => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    Alert.alert(
      "Đổi vai trò",
      `Chuyển ${user.displayName} sang vai trò "${nextRole === "admin" ? "Quản trị viên" : "Người dùng"}"?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xác nhận", onPress: () => applyChange(user.uid, { role: nextRole }) },
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

      <Text style={{ color: "#94a3b8", fontSize: 12, paddingHorizontal: 16, marginBottom: 8 }}>
        {filtered.length} / {users.length} người dùng
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
              <Text style={{ color: "#64748b", fontSize: 12 }}>🪙 {item.coinBalance.toLocaleString()}</Text>
              <Text style={{ color: "#64748b", fontSize: 12 }}>🎯 {item.totalPredictions}</Text>
              <Text style={{ color: "#64748b", fontSize: 12 }}>✓ {Math.round(item.winRate * 100)}%</Text>
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
                <TouchableOpacity onPress={() => handleChangeRole(item)}>
                  <Text style={{ color: "#14b8a6", fontSize: 12, fontWeight: "600" }}>Đổi vai trò</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleToggleActive(item)}>
                  <Text style={{
                    color: item.isActive ? "#ef4444" : "#22c55e",
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
    </SafeAreaView>
  );
}
