import { useEffect } from "react";
import { Tabs, router } from "expo-router";
import { View, Text } from "react-native";
import { useAuthStore } from "../../store/authStore";
import { useNotifications } from "../../hooks/useNotifications";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
    </View>
  );
}

function NotifIcon({ focused }: { focused: boolean }) {
  const { unreadCount } = useNotifications();
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>🔔</Text>
      {unreadCount > 0 && (
        <View
          style={{
            position: "absolute", top: -4, right: -8,
            backgroundColor: "#ef4444", borderRadius: 8,
            minWidth: 16, height: 16, alignItems: "center", justifyContent: "center",
            paddingHorizontal: 3,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/login" as any);
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#171717",
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#14b8a6",
        tabBarInactiveTintColor: "#525252",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Trang chủ", tabBarIcon: ({ focused }) => <TabIcon emoji="⚽" focused={focused} /> }}
      />
      <Tabs.Screen
        name="leagues"
        options={{ title: "Giải đấu", tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" focused={focused} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: "Tìm kiếm", tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} /> }}
      />
      <Tabs.Screen
        name="predictions"
        options={{ title: "Dự đoán", tabBarIcon: ({ focused }) => <TabIcon emoji="🎯" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Cá nhân", tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }}
      />
    </Tabs>
  );
}
