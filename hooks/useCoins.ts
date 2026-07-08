import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { userService } from "../services/userService";
import { QUERY_KEYS } from "../constants/queryKeys";

export function useCoins() {
  const { firebaseUser, user, updateCoinBalance } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = userService.subscribeToUser(firebaseUser.uid, (profile) => {
      updateCoinBalance(profile.coinBalance);
      queryClient.setQueryData(
        QUERY_KEYS.user.profile(firebaseUser.uid),
        profile
      );
    });
    return unsub;
  }, [firebaseUser?.uid]);

  return {
    balance: user?.coinBalance ?? 0,
    totalEarned: user?.totalEarned ?? 0,
    totalLost: user?.totalLost ?? 0,
  };
}
