import { useState } from "react";
import {
  View, Text, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Formik, type FormikHelpers } from "formik";
import { useAuth } from "../../hooks/useAuth";
import { FormField } from "../../components/ui/FormField";
import { forgotPasswordSchema } from "../../utils/validationSchemas";
import { getFriendlyAuthErrorMessage } from "../../utils/firebaseErrors";

interface ForgotPasswordValues {
  email: string;
}

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const handleReset = async (
    values: ForgotPasswordValues,
    { setErrors, setFieldTouched }: FormikHelpers<ForgotPasswordValues>
  ) => {
    try {
      await resetPassword(values.email.trim().toLowerCase());
      setSentEmail(values.email.trim());
      setSent(true);
    } catch (e: any) {
      setErrors({ email: getFriendlyAuthErrorMessage(e) });
      setFieldTouched("email", true, false);
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
          Chúng tôi đã gửi liên kết đặt lại mật khẩu tới {sentEmail}
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

        <Formik<ForgotPasswordValues>
          initialValues={{ email: "" }}
          validationSchema={forgotPasswordSchema}
          onSubmit={handleReset}
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
              />

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
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Gửi liên kết đặt lại</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </Formik>
      </View>
    </KeyboardAvoidingView>
  );
}
