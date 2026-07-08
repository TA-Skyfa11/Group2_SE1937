import { useCallback, useRef, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { usePredictionStore } from "../../store/predictionStore";
import { usePlacePrediction } from "../../hooks/usePredictions";
import { useAuthStore } from "../../store/authStore";
import {
  calculatePotentialPayout,
  formatOdds,
} from "../../utils/oddsCalculator";
import type { Match } from "../../types/match.types";
import type { PredictionOutcome } from "../../types/match.types";
import { APP_CONFIG } from "../../constants/config";

interface Props {
  match: Match;
}

const OUTCOME_LABELS: Record<PredictionOutcome, string> = {
  HOME_WIN: "Chủ nhà thắng",
  DRAW: "Hòa",
  AWAY_WIN: "Khách thắng",
};

const QUICK_AMOUNTS = [50, 100, 200, 500];

export function PredictionSheet({ match }: Props) {
  const { activePrediction, isSheetOpen, closeSheet, resetPrediction } =
    usePredictionStore();
  const { user } = useAuthStore();
  const { mutate: placePrediction, isPending } = usePlacePrediction();
  const [amount, setAmount] = useState("100");

  const outcome = activePrediction?.outcome as PredictionOutcome | undefined;
  const oddsMap: Record<PredictionOutcome, number> = {
    HOME_WIN: match.odds.homeWin,
    DRAW: match.odds.draw,
    AWAY_WIN: match.odds.awayWin,
  };
  const currentOdds = outcome ? oddsMap[outcome] : 1;
  const betAmount = Math.max(0, parseInt(amount || "0", 10));
  const potentialPayout = calculatePotentialPayout(betAmount, currentOdds);
  const coinBalance = user?.coinBalance ?? 0;

  const isInvalid =
    isPending ||
    betAmount < APP_CONFIG.MIN_BET ||
    betAmount > coinBalance;

  const handleConfirm = useCallback(() => {
    if (!outcome || !activePrediction?.matchId || isInvalid) return;
    placePrediction({
      matchId: activePrediction.matchId,
      outcome,
      amount: betAmount,
    });
  }, [outcome, activePrediction, betAmount, isInvalid]);

  return (
    <Modal
      visible={isSheetOpen && !!outcome}
      transparent
      animationType="slide"
      onRequestClose={resetPrediction}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.7)",
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              backgroundColor: "#171717",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 40,
            }}
          >
            {/* Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "#404040",
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />

            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <View>
                <Text className="text-white text-lg font-bold">Đặt dự đoán</Text>
                <Text className="text-neutral-400 text-sm mt-0.5">
                  {match.homeTeam.name} vs {match.awayTeam.name}
                </Text>
              </View>
              <TouchableOpacity onPress={resetPrediction}>
                <Text className="text-neutral-400 text-sm">Hủy</Text>
              </TouchableOpacity>
            </View>

            {/* Selected outcome */}
            {outcome && (
              <View className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-4 mb-4">
                <Text className="text-neutral-400 text-xs mb-1">Dự đoán của bạn</Text>
                <Text className="text-teal-400 font-bold text-lg">
                  {OUTCOME_LABELS[outcome]}
                </Text>
                <Text className="text-white font-semibold mt-1">
                  Tỷ lệ: {formatOdds(currentOdds)}
                </Text>
              </View>
            )}

            {/* Amount input */}
            <Text className="text-neutral-400 text-sm mb-2">
              Số coin muốn cược{" "}
              <Text className="text-white">(số dư: {coinBalance.toLocaleString()})</Text>
            </Text>
            <View className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex-row items-center mb-3">
              <Text className="text-yellow-400 mr-2 text-base">🪙</Text>
              <TextInput
                style={{ flex: 1, color: "#fff", fontSize: 18, fontWeight: "600" }}
                value={amount}
                onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder="100"
                placeholderTextColor="#525252"
              />
            </View>

            {/* Quick amounts */}
            <View className="flex-row gap-x-2 mb-4">
              {QUICK_AMOUNTS.map((q) => (
                <TouchableOpacity
                  key={q}
                  className={`flex-1 py-2 rounded-lg items-center border ${
                    betAmount === q
                      ? "border-teal-500 bg-teal-500/10"
                      : "border-neutral-800 bg-neutral-900"
                  }`}
                  onPress={() => setAmount(String(q))}
                >
                  <Text
                    className={`text-xs font-medium ${
                      betAmount === q ? "text-teal-400" : "text-neutral-400"
                    }`}
                  >
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                className="flex-1 py-2 rounded-lg items-center border border-neutral-800 bg-neutral-900"
                onPress={() => setAmount(String(coinBalance))}
              >
                <Text className="text-xs font-medium text-neutral-400">Tất cả</Text>
              </TouchableOpacity>
            </View>

            {/* Payout preview */}
            <View className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-neutral-400 text-sm">Số cược</Text>
                <Text className="text-white text-sm">{betAmount.toLocaleString()} 🪙</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-neutral-400 text-sm">Tỷ lệ</Text>
                <Text className="text-white text-sm">{formatOdds(currentOdds)}</Text>
              </View>
              <View style={{ height: 1, backgroundColor: "#262626", marginBottom: 8 }} />
              <View className="flex-row justify-between">
                <Text className="text-neutral-400 text-sm font-medium">Tiền có thể nhận</Text>
                <Text className="text-teal-400 font-bold text-base">
                  {potentialPayout.toLocaleString()} 🪙
                </Text>
              </View>
            </View>

            {/* Validation messages */}
            {betAmount > 0 && betAmount < APP_CONFIG.MIN_BET && (
              <Text className="text-red-400 text-xs mb-3 text-center">
                Cược tối thiểu là {APP_CONFIG.MIN_BET} coin
              </Text>
            )}
            {betAmount > coinBalance && (
              <Text className="text-red-400 text-xs mb-3 text-center">
                Không đủ coin
              </Text>
            )}

            {/* Confirm */}
            <TouchableOpacity
              style={{
                backgroundColor: isInvalid ? "#262626" : "#14b8a6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
              onPress={handleConfirm}
              disabled={isInvalid}
            >
              {isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  Xác nhận dự đoán
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
