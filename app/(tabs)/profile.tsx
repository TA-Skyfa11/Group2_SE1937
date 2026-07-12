import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useCoins } from "../../hooks/useCoins";
import { useNotifications } from "../../hooks/useNotifications";
import { useUIStore } from "../../store/uiStore";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import { userService } from "../../services/userService";
import { RoleGuard } from "../../components/common/RoleGuard";

export default function ProfileScreen() {
  // Profile is user-only (reads/writes the user's own Firestore doc).
  // RoleGuard redirects Guests to /login instead of letting this screen
  // mount and fire authenticated-only Firestore queries.
  return (
    <RoleGuard requiredRole="user">
      <ProfileScreenContent />
    </RoleGuard>
  );
}

function ProfileScreenContent() {
  const { user, isAdmin, logout } = useAuth();
  const { balance, totalEarned, totalLost } = useCoins();
  const { unreadCount } = useNotifications();
  const { showToast } = useUIStore();
  const { firebaseUser } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const winRate =
    user && user.totalPredictions > 0
      ? Math.round((user.correctPredictions / user.totalPredictions) * 100)
      : 0;

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          router.replace("/(auth)/login" as any);
          setLoggingOut(false);
        },
      },
    ]);
  };

  const statRows = [
    [
      { label: "Số dư coin", value: `🪙 ${balance.toLocaleString()}` },
      { label: "Tỷ lệ thắng", value: `${winRate}%` },
    ],
    [
      { label: "Tổng dự đoán", value: String(user?.totalPredictions ?? 0) },
      { label: "Chuỗi thắng", value: `🔥 ${user?.currentStreak ?? 0}` },
    ],
    [
      { label: "Coin đã nhận", value: `+${totalEarned.toLocaleString()}` },
      { label: "Coin đã mất", value: `-${totalLost.toLocaleString()}` },
    ],
  ];

  const menuItems = [
    {
      label: "Thông báo",
      icon: "🔔",
      badge: unreadCount > 0 ? unreadCount : undefined,
      onPress: () => router.push("/notifications" as any),
    },
    {
      label: "Lịch sử giao dịch",
      icon: "📋",
      onPress: () => router.push("/transactions" as any),
    },
    {
      label: "Đội bóng yêu thích",
      icon: "❤️",
      onPress: () => router.push("/favorites" as any),
    },
    ...(isAdmin
      ? [
          {
            label: "Trang quản trị",
            icon: "⚙️",
            onPress: () => router.push("/(admin)/dashboard" as any),
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Avatar + name */}
        <View style={{ alignItems: "center", paddingTop: 32, paddingBottom: 24, paddingHorizontal: 16 }}>
          <View
            style={{
              width: 88, height: 88, borderRadius: 44,
              backgroundColor: "#ffffff", borderWidth: 2, borderColor: "#14b8a6",
              alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 36, fontWeight: "700", color: "#14b8a6" }}>
              {user?.displayName?.charAt(0).toUpperCase() ?? "?"}
            </Text>
          </View>

          <Text style={{ color: "#0f172a", fontSize: 22, fontWeight: "700" }}>
            {user?.displayName ?? "Khách"}
          </Text>
          <Text style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            @{user?.username ?? "unknown"}
          </Text>

          {isAdmin && (
            <View
              style={{
                marginTop: 8, backgroundColor: "rgba(20,184,166,0.15)",
                borderWidth: 1, borderColor: "rgba(20,184,166,0.4)",
                borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
              }}
            >
              <Text style={{ color: "#14b8a6", fontSize: 12, fontWeight: "600" }}>Quản trị</Text>
            </View>
          )}
        </View>

        {/* Stats grid */}
        <View
          style={{
            marginHorizontal: 16, backgroundColor: "#ffffff",
            borderWidth: 1, borderColor: "#e7e9ee", borderRadius: 16,
            overflow: "hidden", marginBottom: 16,
          }}
        >
          {statRows.map((row, ri) => (
            <View
              key={ri}
              style={{
                flexDirection: "row",
                borderTopWidth: ri > 0 ? 1 : 0,
                borderTopColor: "#e7e9ee",
              }}
            >
              {row.map(({ label, value }, ci) => (
                <View
                  key={ci}
                  style={{
                    flex: 1, padding: 16,
                    borderLeftWidth: ci > 0 ? 1 : 0,
                    borderLeftColor: "#e7e9ee",
                  }}
                >
                  <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>{label}</Text>
                  <Text style={{ color: "#0f172a", fontSize: 16, fontWeight: "600" }}>{value}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, gap: 8 }}>
          {menuItems.map(({ label, icon, badge, onPress }) => (
            <TouchableOpacity
              key={label}
              onPress={onPress}
              style={{
                backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee",
                borderRadius: 14, padding: 16,
                flexDirection: "row", alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 14 }}>{icon}</Text>
              <Text style={{ color: "#0f172a", flex: 1, fontSize: 15, fontWeight: "500" }}>{label}</Text>
              {badge !== undefined && (
                <View
                  style={{
                    backgroundColor: "#ef4444", borderRadius: 10,
                    minWidth: 20, height: 20, alignItems: "center",
                    justifyContent: "center", paddingHorizontal: 4, marginRight: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                    {badge > 9 ? "9+" : badge}
                  </Text>
                </View>
              )}
              <Text style={{ color: "#cbd5e1", fontSize: 20 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View style={{ marginHorizontal: 16, marginBottom: 48 }}>
          <TouchableOpacity
            onPress={handleLogout}
            disabled={loggingOut}
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
              borderRadius: 14, padding: 16, alignItems: "center",
            }}
          >
            {loggingOut ? (
              <ActivityIndicator color="#ef4444" />
            ) : (
              <Text style={{ color: "#ef4444", fontWeight: "600", fontSize: 15 }}>Đăng xuất</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
