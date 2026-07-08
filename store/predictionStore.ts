import { create } from "zustand";
import type { PlacePredictionPayload } from "../types/prediction.types";

interface PredictionStore {
  activePrediction: Partial<PlacePredictionPayload> | null;
  isSheetOpen: boolean;
  setActivePrediction: (p: Partial<PlacePredictionPayload> | null) => void;
  openSheet: () => void;
  closeSheet: () => void;
  resetPrediction: () => void;
}

export const usePredictionStore = create<PredictionStore>((set) => ({
  activePrediction: null,
  isSheetOpen: false,

  setActivePrediction: (p) => set({ activePrediction: p }),
  openSheet: () => set({ isSheetOpen: true }),
  closeSheet: () => set({ isSheetOpen: false }),
  resetPrediction: () => set({ activePrediction: null, isSheetOpen: false }),
}));
