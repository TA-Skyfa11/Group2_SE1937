import type { Timestamp } from "firebase/firestore";

export type NotificationType =
  | "MATCH_START"
  | "MATCH_RESULT"
  | "PREDICTION_RESULT"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: {
    matchId?: string;
    predictionId?: string;
    screen?: string;
    [key: string]: unknown;
  };
  isRead: boolean;
  createdAt: Timestamp;
}
