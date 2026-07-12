import { useAuthStore } from "../store/authStore";

// coinBalance/totalEarned/totalLost are already kept live by the single
// global profile listener in useAuthListener() (mounted once at the app
// root) — no need for a second onSnapshot listener on the same document
// here. Reading straight from the store avoids duplicate Firestore
// listeners (extra battery/network use) and an extra place this data
// could ever get out of sync.
export function useCoins() {
  const { user } = useAuthStore();

  return {
    balance: user?.coinBalance ?? 0,
    totalEarned: user?.totalEarned ?? 0,
    totalLost: user?.totalLost ?? 0,
  };
}
