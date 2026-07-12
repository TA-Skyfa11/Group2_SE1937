import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useUIStore } from "../../store/uiStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useUIStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showToast("Vui lòng điền đầy đủ thông tin", "error");
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.replace("/(tabs)" as any);
    } catch (e: any) {
      showToast(e?.message ?? "Đăng nhập thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f7f8fb" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 }}>
          {/* Header */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 36, fontWeight: "700", color: "#0f172a", marginBottom: 8 }}>
              ⚽ Match
            </Text>
            <Text style={{ fontSize: 36, fontWeight: "700", color: "#14b8a6", marginBottom: 8 }}>
              Pulse
            </Text>
            <Text style={{ color: "#64748b", fontSize: 15 }}>
              Đăng nhập để xem tỷ số và dự đoán
            </Text>
          </View>

          {/* Email */}
          <Text style={{ color: "#64748b", fontSize: 13, marginBottom: 8, fontWeight: "500" }}>
            Email
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
            autoComplete="email"
          />

          {/* Password */}
          <Text style={{ color: "#64748b", fontSize: 13, marginBottom: 8, fontWeight: "500" }}>
            Password
          </Text>
          <View style={{ position: "relative", marginBottom: 12 }}>
            <TextInput
              style={{
                backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee",
                borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                color: "#0f172a", fontSize: 15, paddingRight: 60,
              }}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoComplete="password"
            />
            <TouchableOpacity
              style={{ position: "absolute", right: 16, top: 14 }}
              onPress={() => setShowPass(!showPass)}
            >
              <Text style={{ color: "#64748b", fontSize: 13 }}>
                {showPass ? "Ẩn" : "Hiện"}
              </Text>
            </TouchableOpacity>
          </View>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={{ alignSelf: "flex-end", marginBottom: 24 }}>
              <Text style={{ color: "#14b8a6", fontSize: 13 }}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity
            style={{
              backgroundColor: loading ? "#0d9488" : "#14b8a6",
              borderRadius: 12, paddingVertical: 16, alignItems: "center",
            }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 32 }}>
            <Text style={{ color: "#64748b" }}>Chưa có tài khoản? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={{ color: "#14b8a6", fontWeight: "500" }}>Đăng ký</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
