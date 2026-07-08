import { View, Text } from "react-native";

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = "📭", title, subtitle }: Props) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-6">
      <Text className="text-5xl mb-4">{icon}</Text>
      <Text className="text-white font-semibold text-lg text-center mb-2">{title}</Text>
      {subtitle && (
        <Text className="text-neutral-400 text-sm text-center">{subtitle}</Text>
      )}
    </View>
  );
}
