import { getCountFromServer } from "firebase/firestore";
import {
  Collections,
  getCollection,
  getDocRef,
  firestoreQuery,
  firestoreUpdate,
  runTransaction,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  db,
} from "../lib/firebase/firestore";
import type { UserProfile, UserRole } from "../types/auth.types";
import type { Match, MatchOdds } from "../types/match.types";

const USE_MOCK = !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === "demo-project";

export const adminService = {
  // ── Users ────────────────────────────────────────────────────────────
  getAllUsers: async (): Promise<UserProfile[]> => {
    if (USE_MOCK) return [];
    const q = query(
      getCollection<UserProfile>(Collections.USERS),
      orderBy("createdAt", "desc"),
      limit(200)
    );
    const rows = await firestoreQuery(q);
    return rows.map((r) => ({ ...r, uid: r.id }));
  },

  // Chỉ đổi field `role` trong Firestore — điều khiển menu/màn hình hiển
  // thị trên app. KHÔNG cấp Custom Claim (chỉ Admin SDK/script mới làm
  // được việc đó), nên tài khoản vừa được nâng lên "admin" ở đây vẫn cần
  // chạy scripts/set-admin-role.js một lần thì các thao tác ghi dữ liệu
  // quản trị (sửa trận đấu, giải đấu...) của họ mới thực sự được Security
  // Rules cho phép.
  updateUserRole: async (uid: string, role: UserRole): Promise<void> => {
    const ref = getDocRef(Collections.USERS, uid);
    await firestoreUpdate(ref, { role, updatedAt: serverTimestamp() });
  },

  setUserActive: async (uid: string, isActive: boolean): Promise<void> => {
    const ref = getDocRef(Collections.USERS, uid);
    await firestoreUpdate(ref, { isActive, updatedAt: serverTimestamp() });
  },

  // Cộng/trừ coin cho 1 người dùng + ghi lại lịch sử giao dịch, thực hiện
  // trong 1 transaction để tránh sai lệch nếu người dùng đó đang có thao
  // tác khác (đặt cược...) diễn ra cùng lúc.
  adjustUserCoins: async (
    uid: string,
    delta: number,
    reason: string,
    adminName: string
  ): Promise<number> => {
    const userRef = getDocRef<UserProfile>(Collections.USERS, uid);
    const txRef = getDocRef(
      `${Collections.USERS}/${uid}/transactions`,
      `admin-${Date.now()}`
    );

    return runTransaction(db, async (txn) => {
      const snap = await txn.get(userRef);
      if (!snap.exists()) throw new Error("Không tìm thấy người dùng.");
      const current = snap.data() as UserProfile;
      const newBalance = Math.max(0, current.coinBalance + delta);
      const now = serverTimestamp();

      txn.update(userRef, { coinBalance: newBalance, updatedAt: now });
      txn.set(txRef, {
        type: "ADMIN_ADJUSTMENT",
        amount: delta,
        balanceAfter: newBalance,
        reference: null,
        description: reason.trim()
          ? `Admin (${adminName}) điều chỉnh: ${reason.trim()}`
          : `Admin (${adminName}) điều chỉnh số dư`,
        createdAt: now,
      });

      return newBalance;
    });
  },

  // ── Matches / Odds ───────────────────────────────────────────────────
  getOpenMatches: async (): Promise<Match[]> => {
    if (USE_MOCK) return [];
    const q = query(
      getCollection<Match>(Collections.MATCHES),
      where("isPredictionOpen", "==", true),
      orderBy("utcDate", "asc"),
      limit(50)
    );
    const rows = await firestoreQuery(q);
    return rows.map((r) => ({ ...r, id: r.id }));
  },

  updateMatchOdds: async (matchId: string, odds: Omit<MatchOdds, "lastUpdated">): Promise<void> => {
    const ref = getDocRef(Collections.MATCHES, matchId);
    await firestoreUpdate(ref, {
      odds: { ...odds, lastUpdated: serverTimestamp() },
      updatedAt: serverTimestamp(),
    });
  },

  getRecentMatches: async (n = 5): Promise<Match[]> => {
    if (USE_MOCK) return [];
    const q = query(
      getCollection<Match>(Collections.MATCHES),
      orderBy("utcDate", "desc"),
      limit(n)
    );
    const rows = await firestoreQuery(q);
    return rows.map((r) => ({ ...r, id: r.id }));
  },

  // ── Dashboard stats ──────────────────────────────────────────────────
  // Dùng getCountFromServer (aggregation query) thay vì tải hết document
  // về đếm — rẻ hơn nhiều lần (chỉ tính phí 1 lượt đọc cho cả kết quả
  // đếm, không phải N lượt đọc cho N document).
  getDashboardStats: async () => {
    if (USE_MOCK) {
      return { totalUsers: 0, liveCount: 0, scheduledCount: 0, totalPredictions: 0 };
    }
    const usersCol = getCollection(Collections.USERS);
    const matchesCol = getCollection<Match>(Collections.MATCHES);
    const predictionsCol = getCollection(Collections.PREDICTIONS);

    const [usersSnap, liveSnap, scheduledSnap, predsSnap] = await Promise.all([
      getCountFromServer(usersCol),
      getCountFromServer(query(matchesCol, where("status", "==", "LIVE"))),
      getCountFromServer(query(matchesCol, where("status", "==", "SCHEDULED"))),
      getCountFromServer(predictionsCol),
    ]);

    return {
      totalUsers: usersSnap.data().count,
      liveCount: liveSnap.data().count,
      scheduledCount: scheduledSnap.data().count,
      totalPredictions: predsSnap.data().count,
    };
  },
};
