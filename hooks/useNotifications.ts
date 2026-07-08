import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { notificationService } from "../services/notificationService";
import { useAuthStore } from "../store/authStore";
import { QUERY_KEYS } from "../constants/queryKeys";
import type { AppNotification } from "../types/notification.types";

export function useNotifications() {
  const { firebaseUser, user } = useAuthStore();
  const queryClient = useQueryClient();
  const uid = firebaseUser?.uid ?? user?.uid ?? "";

  useEffect(() => {
    if (!uid) return;
    const unsub = notificationService.subscribeToNotifications(uid, (notifications) => {
      queryClient.setQueryData(QUERY_KEYS.notifications.mine(uid), notifications);
    });
    return unsub;
  }, [uid, queryClient]);

  useEffect(() => {
    if (!uid) return;
    const unsub = notificationService.subscribeToUnreadCount(uid, (count) => {
      queryClient.setQueryData(["notifications-unread", uid], count);
    });
    return unsub;
  }, [uid, queryClient]);

  const notificationsQuery = useQuery({
    queryKey: QUERY_KEYS.notifications.mine(uid),
    queryFn: () => notificationService.getNotifications(uid),
    enabled: !!uid,
    staleTime: Infinity,
  });

  const unreadCount: number =
    (queryClient.getQueryData(["notifications-unread", uid]) as number) ?? 0;

  const markRead = useMutation({
    mutationFn: (notifId: string) => notificationService.markAsRead(uid, notifId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.mine(uid) });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllAsRead(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.mine(uid) });
    },
  });

  return {
    notifications: (notificationsQuery.data ?? []) as AppNotification[],
    isLoading: notificationsQuery.isLoading,
    unreadCount,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
  };
}
