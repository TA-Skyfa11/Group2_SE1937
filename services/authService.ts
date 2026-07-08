import { firebaseAuth } from "../lib/firebase/auth";
import {
  Collections,
  getDocRef,
  firestoreSet,
  firestoreGet,
  firestoreUpdate,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "../lib/firebase/firestore";
import type {
  LoginCredentials,
  RegisterCredentials,
  UserProfile,
  NotificationPreferences,
} from "../types/auth.types";
import type { User } from "firebase/auth";
import { APP_CONFIG } from "../constants/config";

const DEFAULT_NOTIF_PREFS: NotificationPreferences = {
  matchStart: true,
  matchResult: true,
  predictionResult: true,
  systemAnnouncements: true,
};

export const authService = {
  register: async (credentials: RegisterCredentials): Promise<UserProfile> => {
    const { email, password, username, displayName } = credentials;
    const { user } = await firebaseAuth.register(email, password);
    await firebaseAuth.updateDisplayName(user, displayName);

    const now = serverTimestamp();
    const profile: UserProfile = {
      uid: user.uid,
      email,
      username,
      displayName,
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
      createdAt: null,
      updatedAt: null,
    };

    const docRef = getDocRef<UserProfile>(Collections.USERS, user.uid);
    await firestoreSet(docRef, { ...profile, createdAt: now, updatedAt: now } as unknown as UserProfile, true);

    const txRef = getDocRef(
      `${Collections.USERS}/${user.uid}/transactions`,
      "welcome"
    );
    await firestoreSet(txRef as any, {
      type: "WELCOME_BONUS",
      amount: APP_CONFIG.WELCOME_COINS,
      balanceAfter: APP_CONFIG.WELCOME_COINS,
      reference: null,
      description: "Tiền thưởng chào mừng — 1000 coin!",
      createdAt: now,
    } as any, true);

    return profile;
  },

  login: async (credentials: LoginCredentials): Promise<User> => {
    const { user } = await firebaseAuth.login(credentials.email, credentials.password);
    return user;
  },

  logout: async (): Promise<void> => {
    await firebaseAuth.logout();
  },

  resetPassword: async (email: string): Promise<void> => {
    await firebaseAuth.resetPassword(email);
  },

  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    const docRef = getDocRef<UserProfile>(Collections.USERS, uid);
    const data = await firestoreGet(docRef);
    if (!data) return null;
    return { ...data, uid };
  },

  toggleFavoriteTeam: async (
    uid: string,
    teamId: string,
    isCurrentlyFav: boolean
  ): Promise<void> => {
    const docRef = getDocRef(Collections.USERS, uid);
    await firestoreUpdate(docRef, {
      favoriteTeamIds: isCurrentlyFav ? arrayRemove(teamId) : arrayUnion(teamId),
      updatedAt: serverTimestamp(),
    });
  },

  toggleFavoriteMatch: async (
    uid: string,
    matchId: string,
    isCurrentlyFav: boolean
  ): Promise<void> => {
    const docRef = getDocRef(Collections.USERS, uid);
    await firestoreUpdate(docRef, {
      favoriteMatchIds: isCurrentlyFav ? arrayRemove(matchId) : arrayUnion(matchId),
      updatedAt: serverTimestamp(),
    });
  },

  updateNotifPrefs: async (
    uid: string,
    prefs: Partial<NotificationPreferences>
  ): Promise<void> => {
    const docRef = getDocRef(Collections.USERS, uid);
    const updates: Record<string, unknown> = {};
    Object.entries(prefs).forEach(([key, value]) => {
      updates[`notifPrefs.${key}`] = value;
    });
    await firestoreUpdate(docRef, { ...updates, updatedAt: serverTimestamp() });
  },
};
