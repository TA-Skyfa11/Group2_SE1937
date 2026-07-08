import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { predictionService, USE_MOCK } from "../services/predictionService";
import { useAuthStore } from "../store/authStore";
import { usePredictionStore } from "../store/predictionStore";
import { useUIStore } from "../store/uiStore";
import { QUERY_KEYS } from "../constants/queryKeys";
import type { Prediction, PlacePredictionPayload } from "../types/prediction.types";
import type { PredictionOutcome } from "../types/match.types";

export function useMyPredictions(statusFilter?: Prediction["status"]) {
  const { firebaseUser, user } = useAuthStore();
  const uid = firebaseUser?.uid ?? user?.uid ?? "mock-user-1";

  return useQuery({
    queryKey: [...QUERY_KEYS.predictions.mine(uid), statusFilter],
    queryFn: () => predictionService.getMyPredictions(uid, statusFilter),
    enabled: !!uid,
    staleTime: 30000,
  });
}

export function usePlacePrediction() {
  const { firebaseUser, user, updateCoinBalance } = useAuthStore();
  const { showToast } = useUIStore();
  const { resetPrediction } = usePredictionStore();
  const queryClient = useQueryClient();
  const uid = firebaseUser?.uid ?? user?.uid ?? "mock-user-1";

  return useMutation({
    mutationFn: (payload: PlacePredictionPayload) => {
      if (!uid) throw new Error("Bạn cần đăng nhập để thực hiện việc này.");
      return predictionService.placePrediction(uid, payload);
    },
    onSuccess: (prediction) => {
      // In mock mode there is no Firestore listener to sync coinBalance,
      // so we deduct locally. In real Firebase mode, the onSnapshot
      // listener in useCoins() already reflects the server-side deduction.
      if (USE_MOCK && user) {
        updateCoinBalance(user.coinBalance - prediction.amount);
      }
      showToast(
        `Đặt dự đoán thành công! Có thể nhận: ${prediction.potentialPayout.toLocaleString()} 🪙`,
        "success"
      );
      resetPrediction();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.predictions.mine(uid) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.matches.byId(prediction.matchId) });
    },
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });
}

export function useMatchPredictionSummary(matchId: string) {
  return useQuery({
    queryKey: ["prediction-summary", matchId],
    queryFn: () => predictionService.getMatchPredictionSummary(matchId),
    enabled: !!matchId,
    staleTime: 15000,
  });
}

export function usePredictionSheet(matchId: string) {
  const { user } = useAuthStore();
  const {
    activePrediction,
    isSheetOpen,
    setActivePrediction,
    openSheet,
    closeSheet,
    resetPrediction,
  } = usePredictionStore();
  const { showToast } = useUIStore();

  const selectOutcome = useCallback(
    (outcome: PredictionOutcome) => {
      if (!user) {
        showToast("Đăng nhập để đặt dự đoán", "info");
        return;
      }
      setActivePrediction({ matchId, outcome });
      openSheet();
    },
    [matchId, user]
  );

  const setAmount = useCallback(
    (amount: number) => {
      setActivePrediction({ ...activePrediction, amount });
    },
    [activePrediction]
  );

  return {
    activePrediction,
    isSheetOpen,
    selectOutcome,
    setAmount,
    closeSheet,
    resetPrediction,
    coinBalance: user?.coinBalance ?? 0,
  };
}
