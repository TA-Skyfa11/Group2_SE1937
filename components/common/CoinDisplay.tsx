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
    <View className="flex-row items-center gap-x-1.5 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2">
      <Text className={iconSize}>🪙</Text>
      <Text className={`text-white font-semibold ${textSize}`}>
        {amount.toLocaleString()}
      </Text>
    </View>
  );
}
