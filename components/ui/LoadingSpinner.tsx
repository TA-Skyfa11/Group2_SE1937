import { View, ActivityIndicator } from "react-native";

interface Props {
  size?: "small" | "large";
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = "large", fullScreen = false }: Props) {
  if (fullScreen) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <ActivityIndicator color="#14b8a6" size={size} />
      </View>
    );
  }
  return (
    <View className="py-10 items-center justify-center">
      <ActivityIndicator color="#14b8a6" size={size} />
    </View>
  );
}
