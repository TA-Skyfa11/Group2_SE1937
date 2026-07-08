import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { userService } from "../services/userService";
import { QUERY_KEYS } from "../constants/queryKeys";
import { formatRelative } from "../utils/dateUtils";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

const TX_ICON: Record<string, string> = {
  WELCOME_BONUS: "🎁",
  BET_PLACED: "🎯",
  BET_WON: "✅",
  BET_LOST: "❌",
  ADMIN_ADJUSTMENT: "⚙️",
};

export default function TransactionsScreen() {
  const { firebaseUser, user } = useAuthStore();
  const uid = firebaseUser?.uid ?? user?.uid ?? "";

  const { data: transactions, isLoading } = useQuery({
    queryKey: QUERY_KEYS.user.transactions(uid),
    queryFn: () => userService.getTransactions(uid, 30),
    enabled: !!uid,
    staleTime: 60000,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#737373", fontSize: 15 }}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>Giao dịch</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (transactions?.length ?? 0) === 0 ? (
        <EmptyState icon="📋" title="Chưa có giao dịch" subtitle="Lịch sử coin của bạn sẽ hiện ở đây" />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {transactions!.map((tx) => (
            <View
              key={tx.id}
              style={{
                backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626",
                borderRadius: 14, padding: 14, marginBottom: 8,
                flexDirection: "row", alignItems: "center", gap: 12,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#262626", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 20 }}>{TX_ICON[tx.type] ?? "🪙"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }} numberOfLines={1}>
                  {tx.description}
                </Text>
                <Text style={{ color: "#737373", fontSize: 12, marginTop: 2 }}>
                  Số dư còn lại: 🪙 {tx.balanceAfter.toLocaleString()}
                </Text>
                <Text style={{ color: "#525252", fontSize: 11, marginTop: 2 }}>
                  {formatRelative(tx.createdAt)}
                </Text>
              </View>
              <Text style={{
                fontSize: 16, fontWeight: "700",
                color: tx.amount >= 0 ? "#14b8a6" : "#ef4444",
              }}>
                {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
