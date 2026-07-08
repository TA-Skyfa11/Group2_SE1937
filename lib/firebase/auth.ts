import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  getIdTokenResult,
  type User,
  type UserCredential,
  type IdTokenResult,
} from "firebase/auth";
import { auth } from "./config";

export const firebaseAuth = {
  register: (email: string, password: string): Promise<UserCredential> =>
    createUserWithEmailAndPassword(auth, email, password),

  login: (email: string, password: string): Promise<UserCredential> =>
    signInWithEmailAndPassword(auth, email, password),

  logout: (): Promise<void> => signOut(auth),

  resetPassword: (email: string): Promise<void> =>
    sendPasswordResetEmail(auth, email),

  updateDisplayName: (user: User, displayName: string): Promise<void> =>
    updateProfile(user, { displayName }),

  updatePhotoURL: (user: User, photoURL: string): Promise<void> =>
    updateProfile(user, { photoURL }),

  getIdTokenResult: (
    user: User,
    forceRefresh = false
  ): Promise<IdTokenResult> => getIdTokenResult(user, forceRefresh),

  onAuthStateChanged: (callback: (user: User | null) => void) =>
    onAuthStateChanged(auth, callback),

  getCurrentUser: (): User | null => auth.currentUser,
};
