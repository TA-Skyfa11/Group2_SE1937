import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { useAuthStore } from "../../store/authStore";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/(tabs)" as any);
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f7f8fb" } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
