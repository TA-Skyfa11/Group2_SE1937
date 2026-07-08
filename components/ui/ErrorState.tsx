import { View, Text, TouchableOpacity } from "react-native";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Đã có lỗi xảy ra",
  onRetry,
}: Props) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-6">
      <Text className="text-4xl mb-4">⚠️</Text>
      <Text className="text-white font-semibold text-lg text-center mb-2">
        Rất tiếc!
      </Text>
      <Text className="text-neutral-400 text-sm text-center mb-6">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          className="bg-teal-500 px-6 py-3 rounded-xl"
          onPress={onRetry}
        >
          <Text className="text-white font-semibold">Thử lại</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
