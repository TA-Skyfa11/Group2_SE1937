import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MOCK_USERS, MockUser } from "../../constants/mockData";
import { useUIStore } from "../../store/uiStore";

export default function AdminCoinsScreen() {
  const { showToast } = useUIStore();
  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleAdjust = (uid: string, displayName: string) => {
    const val = parseInt(amount, 10);
    if (isNaN(val) || val === 0) {
      showToast("Vui lòng nhập số hợp lệ", "error");
      return;
    }

    // Mutate the shared mock source so Profile/other screens reflect it too.
    const sharedIdx = MOCK_USERS.findIndex((u) => u.uid === uid);
    if (sharedIdx !== -1) {
      MOCK_USERS[sharedIdx] = {
        ...MOCK_USERS[sharedIdx],
        coinBalance: Math.max(0, MOCK_USERS[sharedIdx].coinBalance + val),
      };
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.uid === uid ? { ...u, coinBalance: Math.max(0, u.coinBalance + val) } : u
      )
    );

    showToast(
      `${val > 0 ? "+" : ""}${val} coin đã được ${val > 0 ? "cộng cho" : "trừ của"} ${displayName}`,
      "success"
    );
    setSelectedUser(null);
    setAmount("");
    setReason("");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>Quản lý coin</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#737373", fontSize: 15 }}>← Quay lại</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={{ color: "#737373", fontSize: 13, marginBottom: 16 }}>
          Chọn một người dùng để điều chỉnh số dư coin ảo của họ.
        </Text>

        {users.map((entry) => (
          <View
            key={entry.uid}
            style={{
              backgroundColor: "#171717", borderWidth: 1,
              borderColor: selectedUser === entry.uid ? "#14b8a6" : "#262626",
              borderRadius: 14, padding: 16, marginBottom: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setSelectedUser(selectedUser === entry.uid ? null : entry.uid)}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>{entry.displayName}</Text>
                  <Text style={{ color: "#737373", fontSize: 12, marginTop: 2 }}>
                    🪙 {entry.coinBalance.toLocaleString()} coin
                  </Text>
                </View>
                <Text style={{ color: selectedUser === entry.uid ? "#14b8a6" : "#404040", fontSize: 20 }}>
                  {selectedUser === entry.uid ? "▲" : "▼"}
                </Text>
              </View>
            </TouchableOpacity>

            {selectedUser === entry.uid && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ color: "#737373", fontSize: 12, marginBottom: 8 }}>
                  Số lượng (dương để cộng, âm để trừ)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#262626", borderWidth: 1, borderColor: "#404040",
                    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                    color: "#fff", fontSize: 15, marginBottom: 10,
                  }}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numbers-and-punctuation"
                  placeholder="+500 hoặc -200"
                  placeholderTextColor="#525252"
                />
                <TextInput
                  style={{
                    backgroundColor: "#262626", borderWidth: 1, borderColor: "#404040",
                    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                    color: "#fff", fontSize: 14, marginBottom: 12,
                  }}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Lý do (không bắt buộc)"
                  placeholderTextColor="#525252"
                />
                <TouchableOpacity
                  onPress={() => handleAdjust(entry.uid, entry.displayName)}
                  style={{ backgroundColor: "#14b8a6", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Xác nhận điều chỉnh</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
