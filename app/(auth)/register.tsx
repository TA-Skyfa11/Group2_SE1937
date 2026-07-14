import {
  View, Text, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { Formik, type FormikHelpers } from "formik";
import { useAuth } from "../../hooks/useAuth";
import { useUIStore } from "../../store/uiStore";
import { FormField } from "../../components/ui/FormField";
import { registerSchema } from "../../utils/validationSchemas";
import { getFriendlyAuthErrorMessage } from "../../utils/firebaseErrors";

interface RegisterValues {
  displayName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const { showToast } = useUIStore();

  const handleRegister = async (
    values: RegisterValues,
    { setErrors, setFieldTouched }: FormikHelpers<RegisterValues>
  ) => {
    try {
      await register({
        email: values.email.trim().toLowerCase(),
        username: values.username.trim(),
        displayName: values.displayName.trim(),
        password: values.password,
      });
      showToast("Chào mừng! Bạn nhận được 1000 coin 🪙", "success");
      router.replace("/(tabs)" as any);
    } catch (e: any) {
      // Lỗi liên quan đăng ký luôn gắn vào field email — đó là field duy
      // nhất mà Firebase Auth thực sự kiểm tra (email đã tồn tại, sai
      // định dạng...). Không hiện Toast với message kỹ thuật của Firebase
      // nữa — chỉ hiện lỗi ngay dưới field, giống các field lỗi khác do
      // Yup validate.
      const message = getFriendlyAuthErrorMessage(e);
      setErrors({ email: message });
      setFieldTouched("email", true, false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f7f8fb" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 }}>
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 32, fontWeight: "700", color: "#0f172a", marginBottom: 8 }}>
              Tạo tài khoản
            </Text>
            <Text style={{ color: "#64748b", fontSize: 15 }}>
              Bắt đầu với 1.000 coin miễn phí 🪙
            </Text>
          </View>

          <Formik<RegisterValues>
            initialValues={{
              displayName: "", username: "", email: "", password: "", confirmPassword: "",
            }}
            validationSchema={registerSchema}
            onSubmit={handleRegister}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
              <>
                <FormField
                  label="Tên hiển thị"
                  placeholder="Tên của bạn"
                  value={values.displayName}
                  onChangeText={handleChange("displayName")}
                  onBlur={handleBlur("displayName")}
                  error={errors.displayName}
                  touched={touched.displayName}
                  autoCapitalize="words"
                />

                <FormField
                  label="Tên đăng nhập"
                  placeholder="ten_dang_nhap"
                  value={values.username}
                  onChangeText={handleChange("username")}
                  onBlur={handleBlur("username")}
                  error={errors.username}
                  touched={touched.username}
                  autoCapitalize="none"
                />

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
                />

                <FormField
                  label="Xác nhận mật khẩu"
                  placeholder="••••••••"
                  value={values.confirmPassword}
                  onChangeText={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
                  error={errors.confirmPassword}
                  touched={touched.confirmPassword}
                  secureToggle
                />

                <TouchableOpacity
                  style={{
                    backgroundColor: isSubmitting ? "#0d9488" : "#14b8a6",
                    borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8,
                  }}
                  onPress={() => handleSubmit()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Tạo tài khoản</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </Formik>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24 }}>
            <Text style={{ color: "#64748b" }}>Đã có tài khoản? </Text>
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
