import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "light" | "dark" | "system";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface UIStore {
  themeMode: ThemeMode;
  toasts: Toast[];
  setThemeMode: (mode: ThemeMode) => void;
  showToast: (message: string, type?: Toast["type"]) => void;
  hideToast: (id: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      themeMode: "dark",
      toasts: [],

      setThemeMode: (themeMode) => set({ themeMode }),

      showToast: (message, type = "info") => {
        const id = Date.now().toString();
        set({ toasts: [...get().toasts, { id, message, type }] });
        setTimeout(() => get().hideToast(id), 3500);
      },

      hideToast: (id) =>
        set({ toasts: get().toasts.filter((t) => t.id !== id) }),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ themeMode: state.themeMode }),
    }
  )
);
