import { View, Text } from "react-native";
import { useAuthStore } from "../../store/authStore";

interface Props {
  balance?: number;
  size?: "sm" | "md" | "lg";
}

export function CoinDisplay({ balance, size = "md" }: Props) {
  const { user } = useAuthStore();
  const amount = balance ?? user?.coinBalance ?? 0;

  const textSize =
    size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : "text-sm";
  const iconSize = size === "sm" ? "text-xs" : size === "lg" ? "text-xl" : "text-sm";

  return (
    <View className="flex-row items-center gap-x-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2">
      <Text className={iconSize}>🪙</Text>
      <Text className={`text-slate-900 font-semibold ${textSize}`}>
        {amount.toLocaleString()}
      </Text>
    </View>
  );
}
