/**
 * Group lifecycle writes. Membership lives in two places that must stay in sync —
 * the `memberIds` array on the group (for rules + "my groups" queries) and the
 * richer `members` subcollection — so every membership change is a single
 * atomic `writeBatch`.
 */
import * as Crypto from 'expo-crypto';
import { arrayUnion, doc, getDoc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';

import { db } from '@/lib/firebase/init';
import { groupDoc, groupsCol, inviteDoc, memberDoc } from '@/lib/firebase/refs';
import type { GroupType, UserProfile } from '@/lib/types';

// Crockford-ish alphabet: no 0/O/1/I to avoid read-aloud confusion.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(length = 6): string {
  const bytes = Crypto.getRandomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return code;
}

export interface CreateGroupInput {
  name: string;
  type: GroupType;
  currency: string;
}

/** Create a group, seed the creator as admin member, and mint an invite code. */
export async function createGroup(
  user: Pick<UserProfile, 'id' | 'displayName' | 'photoURL'>,
  input: CreateGroupInput,
): Promise<string> {
  const groupRef = doc(groupsCol()); // auto-id, inherits the group converter
  const code = generateInviteCode();
  const batch = writeBatch(db);

  batch.set(groupRef, {
    id: groupRef.id,
    name: input.name,
    type: input.type,
    currency: input.currency,
    photoURL: null,
    memberIds: [user.id],
    inviteCode: code,
    budget: null,
    createdBy: user.id,
    // Client timestamps for fields the UI orders by (see expenses/service.ts).
    createdAt: Timestamp.now(),
    updatedAt: serverTimestamp(),
  } as never);

  batch.set(memberDoc(groupRef.id, user.id), {
    id: user.id,
    displayName: user.displayName,
    photoURL: user.photoURL ?? null,
    role: 'admin',
    joinedAt: Timestamp.now(),
    settleStreak: 0,
  } as never);

  batch.set(inviteDoc(code), {
    id: code,
    groupId: groupRef.id,
    createdBy: user.id,
    expiresAt: null,
  } as never);

  await batch.commit();
  return groupRef.id;
}

/** Resolve an invite code and add the current user to the group atomically. */
export async function joinGroupByCode(
  user: Pick<UserProfile, 'id' | 'displayName' | 'photoURL'>,
  code: string,
): Promise<string> {
  const inviteSnap = await getDoc(inviteDoc(code));
  if (!inviteSnap.exists()) throw new Error('That invite code is invalid.');

  const invite = inviteSnap.data();
  if (invite.expiresAt && invite.expiresAt < Date.now()) {
    throw new Error('This invite link has expired.');
  }

  const groupId = invite.groupId;
  const groupSnap = await getDoc(groupDoc(groupId));
  if (!groupSnap.exists()) throw new Error('That group no longer exists.');
  if (groupSnap.data().memberIds.includes(user.id)) return groupId; // already in

  const batch = writeBatch(db);
  batch.update(groupDoc(groupId), {
    memberIds: arrayUnion(user.id),
    updatedAt: serverTimestamp(),
  });
  batch.set(memberDoc(groupId, user.id), {
    id: user.id,
    displayName: user.displayName,
    photoURL: user.photoURL ?? null,
    role: 'member',
    joinedAt: Timestamp.now(),
    settleStreak: 0,
  } as never);

  await batch.commit();
  return groupId;
}
