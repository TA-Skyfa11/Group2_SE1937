import {
  Collections,
  getCollection,
  getDocRef,
  firestoreQuery,
  firestoreUpdate,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  db,
} from "../lib/firebase/firestore";
import type { AppNotification } from "../types/notification.types";
import type { Unsubscribe } from "firebase/firestore";
import { collection, getDocs } from "firebase/firestore";

const USE_MOCK = !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === "demo-project";

const mockNotifications: AppNotification[] = [];

export const notificationService = {
  getNotifications: async (uid: string, limitCount = 30): Promise<AppNotification[]> => {
    if (USE_MOCK) return mockNotifications;
    return firestoreQuery<AppNotification>(
      query(
        getCollection<AppNotification>(`${Collections.USERS}/${uid}/notifications`),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      )
    );
  },

  getUnreadCount: async (uid: string): Promise<number> => {
    if (USE_MOCK) return mockNotifications.filter((n) => !n.isRead).length;
    const snap = await getDocs(
      query(
        collection(db, `${Collections.USERS}/${uid}/notifications`),
        where("isRead", "==", false)
      )
    );
    return snap.size;
  },

  markAsRead: async (uid: string, notifId: string): Promise<void> => {
    if (USE_MOCK) {
      const n = mockNotifications.find((x) => x.id === notifId);
      if (n) n.isRead = true;
      return;
    }
    const ref = getDocRef(`${Collections.USERS}/${uid}/notifications`, notifId);
    return firestoreUpdate(ref, { isRead: true });
  },

  markAllAsRead: async (uid: string): Promise<void> => {
    if (USE_MOCK) {
      mockNotifications.forEach((n) => (n.isRead = true));
      return;
    }
    const snap = await getDocs(
      query(
        collection(db, `${Collections.USERS}/${uid}/notifications`),
        where("isRead", "==", false),
        limit(100)
      )
    );
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { isRead: true }));
    await batch.commit();
  },

  subscribeToNotifications: (
    uid: string,
    callback: (notifications: AppNotification[]) => void
  ): Unsubscribe => {
    if (USE_MOCK) {
      callback(mockNotifications);
      return () => {};
    }
    const q = query(
      getCollection<AppNotification>(`${Collections.USERS}/${uid}/notifications`),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ ...(d.data() as AppNotification), id: d.id })));
    });
  },

  subscribeToUnreadCount: (
    uid: string,
    callback: (count: number) => void
  ): Unsubscribe => {
    if (USE_MOCK) {
      callback(0);
      return () => {};
    }
    const q = query(
      getCollection<AppNotification>(`${Collections.USERS}/${uid}/notifications`),
      where("isRead", "==", false)
    );
    return onSnapshot(q, (snap) => callback(snap.size));
  },
};
