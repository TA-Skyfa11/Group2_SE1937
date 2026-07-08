import { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { useUIStore } from "../../store/uiStore";

const BG: Record<string, string> = {
  success: "#14b8a6",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

function ToastItem({ message, type }: { message: string; type: string }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        backgroundColor: BG[type] ?? BG.info,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", flex: 1 }}>
        {message}
      </Text>
    </Animated.View>
  );
}

export function ToastContainer() {
  const { toasts } = useUIStore();
  if (toasts.length === 0) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 60,
        left: 16,
        right: 16,
        zIndex: 9999,
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} message={t.message} type={t.type} />
      ))}
    </View>
  );
}
