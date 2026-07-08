import {
  Collections,
  getCollection,
  getDocRef,
  firestoreGet,
  firestoreQuery,
  firestoreUpdate,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "../lib/firebase/firestore";
import type { UserProfile } from "../types/auth.types";
import type { Unsubscribe, Timestamp } from "firebase/firestore";

export interface Transaction {
  id: string;
  type: "WELCOME_BONUS" | "BET_PLACED" | "BET_WON" | "BET_LOST" | "ADMIN_ADJUSTMENT";
  amount: number;
  balanceAfter: number;
  reference: string | null;
  description: string;
  createdAt: Timestamp;
}

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
};
