/**
 * Buddy (1:1) service. A buddy pairing is a private 2-person ledger stored in the
 * `groups` collection with kind:'direct' — so the whole expense/settlement engine is
 * reused, while each pair lives in its own document (isolated from real groups).
 *
 * The deterministic pair id makes add-buddy idempotent. Both people's display info
 * is denormalized onto the doc (`participants`) so we never write the *other* user's
 * member document (a cross-user write the rules reject).
 */
import { getDoc, getDocs, limit, query, serverTimestamp, setDoc, Timestamp, where } from 'firebase/firestore';

import { groupDoc, usersCol } from '@/lib/firebase/refs';
import type { UserProfile } from '@/lib/types';

export function pairId(a: string, b: string): string {
  return `direct_${[a, b].sort().join('_')}`;
}

/** Look up a registered user by exact email (single-field index, auto-created). */
export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const snap = await getDocs(query(usersCol(), where('email', '==', email), limit(1)));
  return snap.empty ? null : snap.docs[0].data();
}

type Me = Pick<UserProfile, 'id' | 'displayName' | 'photoURL' | 'defaultCurrency'>;

/**
 * Resolve an email to a user and open (or create) the shared 1:1 ledger.
 * Returns the pair container id.
 */
export async function addBuddy(me: Me, email: string): Promise<string> {
  const buddy = await findUserByEmail(email);
  if (!buddy) throw new Error('No KhataBuddy user with that email.');
  if (buddy.id === me.id) throw new Error('That’s your own email!');

  const id = pairId(me.id, buddy.id);
  const ref = groupDoc(id);
  const existing = await getDoc(ref);
  if (existing.exists()) return id; // already buddies — just open it

  await setDoc(ref, {
    id,
    name: '', // direct containers render the other participant's name instead
    type: 'event', // unused for direct; kind is the real discriminator
    kind: 'direct',
    currency: me.defaultCurrency || 'INR',
    photoURL: null,
    memberIds: [me.id, buddy.id].sort(),
    inviteCode: '',
    budget: null,
    participants: {
      [me.id]: { displayName: me.displayName, photoURL: me.photoURL ?? null },
      [buddy.id]: { displayName: buddy.displayName, photoURL: buddy.photoURL ?? null },
    },
    createdBy: me.id,
    createdAt: Timestamp.now(),
    updatedAt: serverTimestamp(),
  } as never);

  return id;
}
