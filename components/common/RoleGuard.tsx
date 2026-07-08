import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import type { UserRole } from "../../types/auth.types";

interface Props {
  requiredRole: UserRole;
  children: React.ReactNode;
  fallbackRoute?: string;
}

const ROLE_RANK: Record<UserRole, number> = {
  guest: 0,
  user: 1,
  admin: 2,
};

export function RoleGuard({
  requiredRole,
  children,
  fallbackRoute = "/(tabs)",
}: Props) {
  const { role, isLoading, isAuthenticated } = useAuthStore();
  const hasAccess = ROLE_RANK[role] >= ROLE_RANK[requiredRole];

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && requiredRole !== "guest") {
      router.replace("/(auth)/login" as any);
      return;
    }
    if (!hasAccess) {
      router.replace(fallbackRoute as any);
    }
  }, [isLoading, isAuthenticated, hasAccess]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <ActivityIndicator color="#14b8a6" size="large" />
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center px-6">
        <Text className="text-4xl mb-4">🔒</Text>
        <Text className="text-white text-xl font-bold mb-2 text-center">
          Không có quyền truy cập
        </Text>
        <Text className="text-neutral-400 text-center">
          Bạn không có quyền xem trang này.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
