import {
  View, Text, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { Formik, type FormikHelpers } from "formik";
import { useAuth } from "../../hooks/useAuth";
import { FormField } from "../../components/ui/FormField";
import { loginSchema } from "../../utils/validationSchemas";
import { getFriendlyAuthErrorMessage, isInvalidCredentialError } from "../../utils/firebaseErrors";

interface LoginValues {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const { login } = useAuth();

  const handleLogin = async (
    values: LoginValues,
    { setErrors, setFieldTouched }: FormikHelpers<LoginValues>
  ) => {
    try {
      await login({ email: values.email.trim().toLowerCase(), password: values.password });
      router.replace("/(tabs)" as any);
    } catch (e: any) {
      const message = getFriendlyAuthErrorMessage(e);
      if (isInvalidCredentialError(e)) {
        // Không nói rõ là sai email hay sai mật khẩu — gắn lỗi lên cả 2
        // field, giống cách các app lớn (Google, Facebook...) vẫn làm để
        // không lộ thông tin email nào đã tồn tại trong hệ thống.
        setErrors({ email: message, password: message });
        setFieldTouched("email", true, false);
        setFieldTouched("password", true, false);
      } else {
        // Lỗi khác (email sai định dạng, quá nhiều lần thử, mất mạng...)
        // gắn vào field email vì đó là nguyên nhân hợp lý nhất để người
        // dùng nhìn vào sửa trước.
        setErrors({ email: message });
        setFieldTouched("email", true, false);
      }
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

          <Formik<LoginValues>
            initialValues={{ email: "", password: "" }}
            validationSchema={loginSchema}
            onSubmit={handleLogin}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
              <>
                <FormField
                  label="Email"
                  placeholder="you@example.com"
                  value={values.email}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  error={errors.email}
                  touched={touched.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />

                <FormField
                  label="Mật khẩu"
                  placeholder="••••••••"
                  value={values.password}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  error={errors.password}
                  touched={touched.password}
                  secureToggle
                  autoComplete="password"
                />

                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity style={{ alignSelf: "flex-end", marginBottom: 24 }}>
                    <Text style={{ color: "#14b8a6", fontSize: 13 }}>Quên mật khẩu?</Text>
                  </TouchableOpacity>
                </Link>

                <TouchableOpacity
                  style={{
                    backgroundColor: isSubmitting ? "#0d9488" : "#14b8a6",
                    borderRadius: 12, paddingVertical: 16, alignItems: "center",
                  }}
                  onPress={() => handleSubmit()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Đăng nhập</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </Formik>

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
