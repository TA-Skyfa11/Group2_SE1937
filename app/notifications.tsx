import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useNotifications } from "../hooks/useNotifications";
import { formatRelative } from "../utils/dateUtils";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import type { AppNotification } from "../types/notification.types";

const TYPE_ICON: Record<string, string> = {
  MATCH_START: "⚽",
  MATCH_RESULT: "🏁",
  PREDICTION_RESULT: "🎯",
  SYSTEM: "📢",
};

export default function NotificationsScreen() {
  const { notifications, isLoading, unreadCount, markRead, markAllRead } =
    useNotifications();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: "#737373", fontSize: 15 }}>← Quay lại</Text>
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={{ backgroundColor: "#ef4444", borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllRead()}>
            <Text style={{ color: "#14b8a6", fontSize: 13 }}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <EmptyState icon="🔔" title="Chưa có thông báo" subtitle="Bạn đã xem hết thông báo!" />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {notifications.map((notif: AppNotification) => (
            <TouchableOpacity
              key={notif.id}
              onPress={() => markRead(notif.id)}
              style={{
                backgroundColor: notif.isRead ? "#171717" : "rgba(20,184,166,0.07)",
                borderWidth: 1,
                borderColor: notif.isRead ? "#262626" : "rgba(20,184,166,0.25)",
                borderRadius: 14, padding: 14, marginBottom: 8,
                flexDirection: "row", alignItems: "flex-start", gap: 12,
              }}
            >
              <Text style={{ fontSize: 22 }}>{TYPE_ICON[notif.type] ?? "📢"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: notif.isRead ? "500" : "700" }}>
                  {notif.title}
                </Text>
                <Text style={{ color: "#737373", fontSize: 13, marginTop: 3, lineHeight: 18 }}>
                  {notif.body}
                </Text>
                <Text style={{ color: "#525252", fontSize: 11, marginTop: 6 }}>
                  {formatRelative(notif.createdAt)}
                </Text>
              </View>
              {!notif.isRead && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#14b8a6", marginTop: 4 }} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
