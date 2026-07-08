import { useEffect, useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";
import { firebaseAuth } from "../lib/firebase/auth";
import {
  Collections,
  getDocRef,
  onSnapshot,
} from "../lib/firebase/firestore";
import { userService } from "../services/userService";
import type {
  LoginCredentials,
  RegisterCredentials,
  UserProfile,
} from "../types/auth.types";
import type { Unsubscribe } from "firebase/firestore";

const USE_MOCK = !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === "demo-project";

export function useAuth() {
  const {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated,
    role,
    setFirebaseUser,
    setUserProfile,
    setLoading,
    logout: storeLogout,
  } = useAuthStore();

  useEffect(() => {
    if (USE_MOCK) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubProfile: Unsubscribe | null = null;

    const unsubAuth = firebaseAuth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        const docRef = getDocRef<UserProfile>(Collections.USERS, fbUser.uid);
        unsubProfile = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            setUserProfile({ ...(snap.data() as UserProfile), uid: snap.id });
          }
        });
      } else {
        unsubProfile?.();
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    if (USE_MOCK) {
      // Mock login: create a fake user profile
      const mockProfile: UserProfile = {
        uid: "mock-user-1",
        email: credentials.email,
        username: "mockuser",
        displayName: "Người dùng Demo",
        avatarUrl: null,
        role: credentials.email.includes("admin") ? "admin" : "user",
        coinBalance: 1000,
        totalEarned: 1000,
        totalLost: 0,
        totalPredictions: 0,
        correctPredictions: 0,
        currentStreak: 0,
        bestStreak: 0,
        winRate: 0,
        favoriteTeamIds: [],
        favoriteMatchIds: [],
        pushToken: null,
        notifPrefs: {
          matchStart: true,
          matchResult: true,
          predictionResult: true,
          systemAnnouncements: true,
        },
        isActive: true,
        createdAt: null,
        updatedAt: null,
      };
      setFirebaseUser({ uid: "mock-user-1", email: credentials.email } as any);
      setUserProfile(mockProfile);
      return;
    }
    await authService.login(credentials);
  }, [setFirebaseUser, setUserProfile]);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    if (USE_MOCK) {
      const mockProfile: UserProfile = {
        uid: "mock-user-1",
        email: credentials.email,
        username: credentials.username,
        displayName: credentials.displayName,
        avatarUrl: null,
        role: "user",
        coinBalance: 1000,
        totalEarned: 1000,
        totalLost: 0,
        totalPredictions: 0,
        correctPredictions: 0,
        currentStreak: 0,
        bestStreak: 0,
        winRate: 0,
        favoriteTeamIds: [],
        favoriteMatchIds: [],
        pushToken: null,
        notifPrefs: {
          matchStart: true,
          matchResult: true,
          predictionResult: true,
          systemAnnouncements: true,
        },
        isActive: true,
        createdAt: null,
        updatedAt: null,
      };
      setFirebaseUser({ uid: "mock-user-1", email: credentials.email } as any);
      setUserProfile(mockProfile);
      return;
    }
    await authService.register(credentials);
  }, [setFirebaseUser, setUserProfile]);

  const logout = useCallback(async () => {
    if (!USE_MOCK) await authService.logout();
    storeLogout();
  }, [storeLogout]);

  const resetPassword = useCallback(async (email: string) => {
    if (USE_MOCK) return;
    await authService.resetPassword(email);
  }, []);

  return {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated,
    role,
    isAdmin: role === "admin",
    isUser: role === "user" || role === "admin",
    login,
    register,
    logout,
    resetPassword,
  };
}
