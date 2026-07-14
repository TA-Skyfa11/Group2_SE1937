import { View, Text, TextInput, TouchableOpacity, type TextInputProps } from "react-native";
import { useState } from "react";

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  touched?: boolean;
  secureToggle?: boolean; // hiện nút "Hiện/Ẩn" cho mật khẩu
}

export function FormField({
  label,
  error,
  touched,
  secureToggle,
  secureTextEntry,
  ...inputProps
}: FormFieldProps) {
  const [showSecure, setShowSecure] = useState(false);
  const hasError = !!(touched && error);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: "#64748b", fontSize: 13, marginBottom: 8, fontWeight: "500" }}>
        {label}
      </Text>
      <View style={{ position: "relative" }}>
        <TextInput
          style={{
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: hasError ? "#ef4444" : "#e7e9ee",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            color: "#0f172a",
            fontSize: 15,
            paddingRight: secureToggle ? 60 : 16,
          }}
          placeholderTextColor="#94a3b8"
          secureTextEntry={secureToggle ? !showSecure : secureTextEntry}
          {...inputProps}
        />
        {secureToggle && (
          <TouchableOpacity
            style={{ position: "absolute", right: 16, top: 14 }}
            onPress={() => setShowSecure((s) => !s)}
          >
            <Text style={{ color: "#64748b", fontSize: 13 }}>
              {showSecure ? "Ẩn" : "Hiện"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {hasError && (
        <Text style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{error}</Text>
      )}
    </View>
  );
}
