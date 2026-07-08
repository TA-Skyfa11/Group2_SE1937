import { useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";
import { useUIStore } from "../store/uiStore";

export function useFavorites() {
  const { user, firebaseUser } = useAuthStore();
  const { showToast } = useUIStore();

  const favoriteTeamIds = user?.favoriteTeamIds ?? [];
  const favoriteMatchIds = user?.favoriteMatchIds ?? [];

  const toggleTeam = useCallback(
    async (teamId: string) => {
      if (!firebaseUser?.uid) {
        showToast("Đăng nhập để theo dõi đội bóng", "info");
        return;
      }
      const isFav = favoriteTeamIds.includes(teamId);
      try {
        await authService.toggleFavoriteTeam(firebaseUser.uid, teamId, isFav);
        showToast(isFav ? "Đã bỏ theo dõi đội bóng" : "Đã theo dõi đội bóng ❤️", "success");
      } catch {
        showToast("Cập nhật yêu thích thất bại", "error");
      }
    },
    [firebaseUser?.uid, favoriteTeamIds]
  );

  const toggleMatch = useCallback(
    async (matchId: string) => {
      if (!firebaseUser?.uid) {
        showToast("Đăng nhập để lưu trận đấu", "info");
        return;
      }
      const isFav = favoriteMatchIds.includes(matchId);
      try {
        await authService.toggleFavoriteMatch(firebaseUser.uid, matchId, isFav);
        showToast(isFav ? "Đã bỏ lưu trận đấu" : "Đã lưu trận đấu ⭐", "success");
      } catch {
        showToast("Cập nhật yêu thích thất bại", "error");
      }
    },
    [firebaseUser?.uid, favoriteMatchIds]
  );

  return {
    favoriteTeamIds,
    favoriteMatchIds,
    isTeamFavorite: (id: string) => favoriteTeamIds.includes(id),
    isMatchFavorite: (id: string) => favoriteMatchIds.includes(id),
    toggleTeam,
    toggleMatch,
  };
}
