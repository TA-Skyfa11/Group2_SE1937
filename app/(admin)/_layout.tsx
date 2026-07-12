import { Stack } from "expo-router";
import { RoleGuard } from "../../components/common/RoleGuard";

export default function AdminLayout() {
  return (
    <RoleGuard requiredRole="admin">
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f7f8fb" } }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="users" />
        <Stack.Screen name="odds" />
        <Stack.Screen name="coins" />
      </Stack>
    </RoleGuard>
  );
}
