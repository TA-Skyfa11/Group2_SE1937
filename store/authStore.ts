import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "firebase/auth";
import type { UserProfile, UserRole } from "../types/auth.types";

interface AuthStore {
  user: UserProfile | null;
  firebaseUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole;
  setFirebaseUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  updateCoinBalance: (balance: number) => void;
  updatePushToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      firebaseUser: null,
      isLoading: true,
      isAuthenticated: false,
      role: "guest" as UserRole,

      setFirebaseUser: (firebaseUser) => {
        set({
          firebaseUser,
          isAuthenticated: !!firebaseUser,
          isLoading: false,
        });
      },

      setUserProfile: (profile) => {
        set({
          user: profile,
          role: profile?.role ?? "guest",
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      updateCoinBalance: (balance) => {
        const user = get().user;
        if (!user) return;
        set({ user: { ...user, coinBalance: balance } });
      },

      updatePushToken: (token) => {
        const user = get().user;
        if (!user) return;
        set({ user: { ...user, pushToken: token } });
      },

      logout: () => {
        set({
          user: null,
          firebaseUser: null,
          isAuthenticated: false,
          isLoading: false,
          role: "guest",
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
