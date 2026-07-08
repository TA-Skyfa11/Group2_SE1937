import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useUIStore } from "../../store/uiStore";

export default function RegisterScreen() {
  const [form, setForm] = useState({
    displayName: "", username: "", email: "", password: "", confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useUIStore();

  const update = (field: keyof typeof form) => (v: string) =>
    setForm((p) => ({ ...p, [field]: v }));

  const handleRegister = async () => {
    const { email, username, displayName, password, confirmPassword } = form;
    if (!email || !username || !displayName || !password) {
      showToast("Vui lòng điền đầy đủ thông tin", "error"); return;
    }
    if (password !== confirmPassword) {
      showToast("Mật khẩu không khớp", "error"); return;
    }
    if (password.length < 6) {
      showToast("Mật khẩu phải có ít nhất 6 ký tự", "error"); return;
    }
    if (username.length < 3) {
      showToast("Tên đăng nhập phải có ít nhất 3 ký tự", "error"); return;
    }
    setLoading(true);
    try {
      await register({ email: email.trim().toLowerCase(), username, displayName, password });
      showToast("Chào mừng! Bạn nhận được 1000 coin 🪙", "success");
      router.replace("/(tabs)" as any);
    } catch (e: any) {
      showToast(e?.message ?? "Đăng ký thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: "Tên hiển thị", field: "displayName", placeholder: "Tên của bạn", keyboard: "default" },
    { label: "Tên đăng nhập", field: "username", placeholder: "ten_dang_nhap", keyboard: "default" },
    { label: "Email", field: "email", placeholder: "you@example.com", keyboard: "email-address" },
    { label: "Mật khẩu", field: "password", placeholder: "••••••••", secure: true },
    { label: "Xác nhận mật khẩu", field: "confirmPassword", placeholder: "••••••••", secure: true },
  ] as const;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0a0a0a" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 }}>
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 32, fontWeight: "700", color: "#fff", marginBottom: 8 }}>
              Tạo tài khoản
            </Text>
            <Text style={{ color: "#737373", fontSize: 15 }}>
              Bắt đầu với 1.000 coin miễn phí 🪙
            </Text>
          </View>

          {fields.map(({ label, field, placeholder, keyboard, secure }) => (
            <View key={field} style={{ marginBottom: 16 }}>
              <Text style={{ color: "#737373", fontSize: 13, marginBottom: 8, fontWeight: "500" }}>
                {label}
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626",
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                  color: "#fff", fontSize: 15,
                }}
                placeholder={placeholder}
                placeholderTextColor="#525252"
                value={form[field]}
                onChangeText={update(field)}
                keyboardType={(keyboard as any) ?? "default"}
                secureTextEntry={secure}
                autoCapitalize={field === "email" ? "none" : field === "username" ? "none" : "words"}
              />
            </View>
          ))}

          <TouchableOpacity
            style={{
              backgroundColor: loading ? "#0d9488" : "#14b8a6",
              borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8,
            }}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Tạo tài khoản</Text>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24 }}>
            <Text style={{ color: "#737373" }}>Đã có tài khoản? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: "#14b8a6", fontWeight: "500" }}>Đăng nhập</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
