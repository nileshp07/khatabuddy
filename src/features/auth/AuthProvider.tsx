/**
 * Bridges Firebase Auth into the synchronous session store and keeps the user's
 * profile document live. Mount once, above the navigation tree.
 */
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { useEffect, type ReactNode } from 'react';

import { auth } from '@/lib/firebase/init';
import { userDoc } from '@/lib/firebase/refs';
import { useSession } from '@/store/session';

import { ensureUserProfile } from './service';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useSession((s) => s.setSession);
  const setProfile = useSession((s) => s.setProfile);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      unsubProfile?.();
      unsubProfile = undefined;

      if (!user) {
        setProfile(null);
        setSession(null);
        return;
      }

      await ensureUserProfile(user.uid, {
        displayName: user.displayName ?? user.email?.split('@')[0] ?? 'You',
        email: user.email ?? '',
        photoURL: user.photoURL,
      });
      setSession(user.uid);

      // Keep the profile document live (push tokens, display name, streaks…).
      unsubProfile = onSnapshot(userDoc(user.uid), (snap) =>
        setProfile(snap.exists() ? snap.data() : null),
      );
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, [setSession, setProfile]);

  return <>{children}</>;
}
