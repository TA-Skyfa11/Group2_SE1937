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

// This effect must run EXACTLY ONCE for the whole app — call it only from
// the root layout (app/_layout.tsx), never from individual screens.
//
// Why this has to be a separate hook from useAuth(): every component that
// previously called useAuth() re-ran this same onAuthStateChanged +
// onSnapshot setup as its OWN separate effect instance, all writing to the
// same global Zustand store. Opening "Cá nhân" (which calls useAuth())
// would immediately flip the shared `isLoading` back to `true` again via
// this effect's own `setLoading(true)`. If the user navigated away before
// THAT particular instance's first profile snapshot arrived, its cleanup
// function unsubscribed the listener without ever calling `setLoading
// (false)` again — leaving the whole app's `isLoading` stuck at `true`
// forever, which is exactly why RoleGuard (shared by "Dự đoán" and "Cá
// nhân") got stuck showing its loading spinner on BOTH tabs after that.
export function useAuthListener() {
  const { setFirebaseUser, setUserProfile, setLoading } = useAuthStore();

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
        // Force-refresh the ID token so any Custom Claims change (e.g. an
        // admin role granted via scripts/set-admin-role.js while this
        // device still had a cached session/token) is picked up right
        // away. Without this, Firestore Security Rules keep seeing the
        // stale `request.auth.token.role` and every admin write fails
        // with permission-denied even though the UI already shows the
        // Admin screen (which is gated by the Firestore `role` field,
        // not by the token).
        await firebaseAuth.getIdTokenResult(fbUser, true).catch(() => {});

        const docRef = getDocRef<UserProfile>(Collections.USERS, fbUser.uid);
        let gotFirstSnapshot = false;
        unsubProfile = onSnapshot(
          docRef,
          (snap) => {
            if (snap.exists()) {
              setUserProfile({ ...(snap.data() as UserProfile), uid: snap.id });
            } else if (!gotFirstSnapshot) {
              // Signed-in account with NO Firestore profile doc (e.g. the
              // Firestore write during registration failed while the
              // Firebase Auth account still got created — an "orphaned"
              // account). Without self-healing this, `role` stays stuck
              // at "guest" forever even though the user is really signed
              // in, permanently locking them out of "Dự đoán" / "Cá
              // nhân" (RoleGuard never sees them as role >= "user").
              // Creating the missing doc here re-triggers this same
              // onSnapshot listener with the new data automatically.
              userService.ensureProfile(fbUser).catch(() => {});
            }
            // Only the FIRST snapshot should resolve the app-wide loading
            // state — this guarantees `role` is already correct (not
            // just `isAuthenticated`) by the time any screen reads
            // `isLoading === false`.
            if (!gotFirstSnapshot) {
              gotFirstSnapshot = true;
              setLoading(false);
            }
          },
          () => {
            // e.g. permission-denied — don't leave the app stuck loading
            // forever if the profile listener itself errors out.
            if (!gotFirstSnapshot) {
              gotFirstSnapshot = true;
              setLoading(false);
            }
          }
        );
      } else {
        unsubProfile?.();
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// Safe to call from as many components as needed — this is a PURE reader
// of the global auth store plus a few stable action callbacks. It sets up
// no listeners and no effects of its own, so calling it from "Dự đoán",
// "Cá nhân", or anywhere else can never disturb the app-wide loading/auth
// state that useAuthListener() (mounted once, at the root) owns.
export function useAuth() {
  const {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated,
    role,
    setFirebaseUser,
    setUserProfile,
    logout: storeLogout,
  } = useAuthStore();

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
