/**
 * Auth service — thin wrappers around Firebase Auth + the user profile document.
 * Errors are translated into friendly messages for the UI.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth } from '@/lib/firebase/init';
import { userDoc } from '@/lib/firebase/refs';

interface ProfileSeed {
  displayName: string;
  email: string;
  photoURL?: string | null;
}

/** Create the user profile doc on first sign-in if it doesn't exist yet. */
export async function ensureUserProfile(uid: string, seed: ProfileSeed): Promise<void> {
  const ref = userDoc(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    id: uid,
    displayName: seed.displayName,
    email: seed.email,
    photoURL: seed.photoURL ?? null,
    defaultCurrency: 'INR',
    pushTokens: [],
    createdAt: serverTimestamp(),
    // serverTimestamp() is a FieldValue, not a number — safe at write time.
  } as never);
}

export async function signUp(name: string, email: string, password: string): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await ensureUserProfile(cred.user.uid, { displayName: name, email });
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Map Firebase auth error codes to human copy. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'That email is already registered.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/weak-password':
      return 'Choose a stronger password (6+ characters).';
    case 'auth/network-request-failed':
      return 'Network error — check your connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again in a moment.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
