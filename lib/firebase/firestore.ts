import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
  runTransaction,
  Timestamp,
  FieldValue,
  type DocumentReference,
  type CollectionReference,
  type Query,
  type QueryConstraint,
  type DocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
  type Transaction,
  type WriteBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./config";

export const Collections = {
  USERS: "users",
  MATCHES: "matches",
  LEAGUES: "leagues",
  TEAMS: "teams",
  PREDICTIONS: "predictions",
  LEADERBOARDS: "leaderboards",
} as const;

export const SubCollections = {
  TRANSACTIONS: "transactions",
  NOTIFICATIONS: "notifications",
  PREDICTIONS: "predictions",
  PLAYERS: "players",
  EVENTS: "events",
  LINEUPS: "lineups",
  SEASONS: "seasons",
  STANDINGS: "standings",
  ENTRIES: "entries",
} as const;

export function getCollection<T = DocumentData>(
  path: string
): CollectionReference<T> {
  return collection(db, path) as CollectionReference<T>;
}

export function getDocRef<T = DocumentData>(
  path: string,
  ...segments: string[]
): DocumentReference<T> {
  return doc(db, path, ...segments) as DocumentReference<T>;
}

export async function firestoreGet<T>(
  ref: DocumentReference<T>
): Promise<T | null> {
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as T) : null;
}

export function firestoreSet<T>(
  ref: DocumentReference<T>,
  data: T,
  merge = false
): Promise<void> {
  return setDoc(ref, data, { merge });
}

export function firestoreUpdate(
  ref: DocumentReference,
  data: Record<string, unknown>
): Promise<void> {
  return updateDoc(ref, data);
}

export function firestoreDelete(ref: DocumentReference): Promise<void> {
  return deleteDoc(ref);
}

export async function firestoreQuery<T>(
  q: CollectionReference<T> | Query<T>
): Promise<Array<T & { id: string }>> {
  const snap: QuerySnapshot<T> = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<T>) => ({
    id: d.id,
    ...(d.data() as T),
  }));
}

export {
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
  runTransaction,
  Timestamp,
  FieldValue,
  db,
};

export type {
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  Transaction,
  WriteBatch,
  QueryConstraint,
};
