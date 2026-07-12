import {
  Collections,
  getCollection,
  getDocRef,
  firestoreGet,
  firestoreQuery,
  firestoreUpdate,
  firestoreSet,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "../lib/firebase/firestore";
import type { UserProfile, NotificationPreferences } from "../types/auth.types";
import type { Unsubscribe, Timestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { APP_CONFIG } from "../constants/config";

export interface Transaction {
  id: string;
  type: "WELCOME_BONUS" | "BET_PLACED" | "BET_WON" | "BET_LOST" | "ADMIN_ADJUSTMENT";
  amount: number;
  balanceAfter: number;
  reference: string | null;
  description: string;
  createdAt: Timestamp;
}

const DEFAULT_NOTIF_PREFS: NotificationPreferences = {
  matchStart: true,
  matchResult: true,
  predictionResult: true,
  systemAnnouncements: true,
};

const USE_MOCK = !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === "demo-project";

export const userService = {
  getUserById: async (uid: string): Promise<UserProfile | null> => {
    if (USE_MOCK) return null;
    const ref = getDocRef<UserProfile>(Collections.USERS, uid);
    const data = await firestoreGet(ref);
    if (!data) return null;
    return { ...data, uid };
  },

  subscribeToUser: (
    uid: string,
    callback: (profile: UserProfile) => void
  ): Unsubscribe => {
    if (USE_MOCK) return () => {};
    const ref = getDocRef<UserProfile>(Collections.USERS, uid);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback({ ...(snap.data() as UserProfile), uid: snap.id });
      }
    });
  },

  getTransactions: async (uid: string, limitCount = 20): Promise<Transaction[]> => {
    if (USE_MOCK) return [];
    return firestoreQuery<Transaction>(
      query(
        getCollection<Transaction>(`${Collections.USERS}/${uid}/transactions`),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      )
    );
  },

  updateProfile: async (
    uid: string,
    updates: Partial<Pick<UserProfile, "displayName" | "avatarUrl">>
  ): Promise<void> => {
    if (USE_MOCK) return;
    const ref = getDocRef(Collections.USERS, uid);
    return firestoreUpdate(ref, { ...updates, updatedAt: serverTimestamp() });
  },

  // Self-heal an authenticated account that has no Firestore profile doc
  // (e.g. registration's Firestore write previously failed while the
  // Firebase Auth account was still created — an "orphaned" account).
  // Without this, `role` in the app would stay stuck at "guest" forever
  // for that account, permanently locking the user out of "Dự đoán" and
  // "Cá nhân" even though they're actually signed in.
  ensureProfile: async (firebaseUser: User): Promise<void> => {
    if (USE_MOCK) return;
    const now = serverTimestamp();
    const fallbackName = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "user";
    const profile: Omit<UserProfile, "uid"> = {
      email: firebaseUser.email ?? "",
      username: fallbackName,
      displayName: firebaseUser.displayName || fallbackName,
      avatarUrl: null,
      role: "user",
      coinBalance: APP_CONFIG.WELCOME_COINS,
      totalEarned: APP_CONFIG.WELCOME_COINS,
      totalLost: 0,
      totalPredictions: 0,
      correctPredictions: 0,
      currentStreak: 0,
      bestStreak: 0,
      winRate: 0,
      favoriteTeamIds: [],
      favoriteMatchIds: [],
      pushToken: null,
      notifPrefs: DEFAULT_NOTIF_PREFS,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    } as unknown as Omit<UserProfile, "uid">;
    const ref = getDocRef<UserProfile>(Collections.USERS, firebaseUser.uid);
    // merge: true so this is a no-op if the doc actually exists already
    // (e.g. a rare race with the real onSnapshot update).
    await firestoreSet(ref, profile as UserProfile, true);
  },
};
