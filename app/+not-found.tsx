import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 56, marginBottom: 20 }}>⚽</Text>
      <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 10 }}>
        Không tìm thấy trang
      </Text>
      <Text style={{ color: "#737373", fontSize: 15, textAlign: "center", marginBottom: 32 }}>
        Trang bạn đang tìm không tồn tại.
      </Text>
      <TouchableOpacity
        onPress={() => router.replace("/(tabs)" as any)}
        style={{ backgroundColor: "#14b8a6", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Về trang chủ</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
