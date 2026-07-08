import type { Timestamp } from "firebase/firestore";

export function tsToDate(ts: Timestamp | null | undefined): Date | null {
  if (!ts) return null;
  return ts.toDate();
}

export function formatMatchDate(ts: Timestamp | null | undefined): string {
  const date = tsToDate(ts);
  if (!date) return "TBD";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateFull(ts: Timestamp | null | undefined): string {
  const date = tsToDate(ts);
  if (!date) return "TBD";
  return date.toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(ts: Timestamp | null | undefined): string {
  const date = tsToDate(ts);
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
