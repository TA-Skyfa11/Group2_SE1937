import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useUIStore } from "../../store/uiStore";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { showToast } = useUIStore();

  const handleReset = async () => {
    if (!email.trim()) { showToast("Vui lòng nhập email", "error"); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (e: any) {
      showToast(e?.message ?? "Không thể gửi email. Vui lòng thử lại", "error");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f7f8fb", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 24 }}>✉️</Text>
        <Text style={{ color: "#0f172a", fontSize: 22, fontWeight: "700", marginBottom: 12, textAlign: "center" }}>
          Kiểm tra hộp thư của bạn
        </Text>
        <Text style={{ color: "#64748b", fontSize: 15, textAlign: "center", marginBottom: 32 }}>
          Chúng tôi đã gửi liên kết đặt lại mật khẩu tới {email}
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: "#0f172a", fontWeight: "600" }}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f7f8fb" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
        <TouchableOpacity style={{ marginBottom: 32 }} onPress={() => router.back()}>
          <Text style={{ color: "#64748b", fontSize: 15 }}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 32, fontWeight: "700", color: "#0f172a", marginBottom: 8 }}>
          Đặt lại mật khẩu
        </Text>
        <Text style={{ color: "#64748b", fontSize: 15, marginBottom: 32 }}>
          Nhập email của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
        </Text>
        <TextInput
          style={{
            backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee",
            borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
            color: "#0f172a", fontSize: 15, marginBottom: 16,
          }}
          placeholder="you@example.com"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={{
            backgroundColor: loading ? "#0d9488" : "#14b8a6",
            borderRadius: 12, paddingVertical: 16, alignItems: "center",
          }}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Gửi liên kết đặt lại</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
