/**
 * Session state mirrors Firebase Auth into a synchronous, subscribable store so
 * screens and the route guard can read auth status without async calls. It is
 * populated by the auth listener in features/auth/AuthProvider.
 */
import { create } from 'zustand';

import type { UserProfile } from '@/lib/types';

export type SessionStatus = 'loading' | 'authed' | 'unauthed';

interface SessionState {
  status: SessionStatus;
  uid: string | null;
  profile: UserProfile | null;
  setSession: (uid: string | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  reset: () => void;
}

export const useSession = create<SessionState>((set) => ({
  status: 'loading',
  uid: null,
  profile: null,
  setSession: (uid) => set({ uid, status: uid ? 'authed' : 'unauthed' }),
  setProfile: (profile) => set({ profile }),
  reset: () => set({ status: 'unauthed', uid: null, profile: null }),
}));
