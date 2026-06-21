import { orderBy, query, where } from 'firebase/firestore';
import { useMemo } from 'react';

import { groupDoc, groupsCol, membersCol } from '@/lib/firebase/refs';
import { useCollection, useDoc } from '@/lib/hooks/useFirestore';
import type { Group, GroupMember } from '@/lib/types';

/**
 * Every container the user belongs to (groups AND 1:1 buddy pairs), newest first.
 * We sort client-side instead of with orderBy() so the query needs no composite
 * index (array-contains alone is auto-indexed) — keeps setup zero-config. Callers
 * partition by `kind` ('direct' = buddy pair).
 */
export function useMyContainers(uid: string | null) {
  const q = useMemo(
    () => (uid ? query(groupsCol(), where('memberIds', 'array-contains', uid)) : null),
    [uid],
  );
  const res = useCollection(q);
  const data = useMemo(
    () => [...res.data].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [res.data],
  );
  return { ...res, data };
}

/** Just the real groups (excludes 1:1 buddy pairs). */
export function useMyGroups(uid: string | null) {
  const res = useMyContainers(uid);
  const data = useMemo(() => res.data.filter((g) => g.kind !== 'direct'), [res.data]);
  return { ...res, data };
}

export function useGroup(groupId: string) {
  const ref = useMemo(() => groupDoc(groupId), [groupId]);
  return useDoc(ref);
}

export function useGroupMembers(groupId: string) {
  const q = useMemo(
    () => (groupId ? query(membersCol(groupId), orderBy('joinedAt', 'asc')) : null),
    [groupId],
  );
  return useCollection(q);
}

/**
 * Members for any container. For a normal group, reads the `members` subcollection.
 * For a direct (buddy) pair there is no subcollection — members are synthesized from
 * the denormalized `participants` map on the doc. This is the adapter that lets the
 * group detail / add-expense / settle / expense-detail screens serve both.
 */
export function useContainerMembers(group: Group | null): { data: GroupMember[]; loading: boolean } {
  const isDirect = group?.kind === 'direct';
  // Always call the hook (rules of hooks); for direct we ignore its (empty) result.
  const sub = useGroupMembers(isDirect || !group ? '' : group.id);

  return useMemo(() => {
    if (isDirect && group?.participants) {
      const synth: GroupMember[] = Object.entries(group.participants).map(([id, p]) => ({
        id,
        displayName: p.displayName,
        photoURL: p.photoURL ?? null,
        role: 'member',
        joinedAt: 0,
      }));
      return { data: synth, loading: false };
    }
    return { data: sub.data, loading: sub.loading };
  }, [isDirect, group?.participants, sub.data, sub.loading]);
}

/** Index members by uid for O(1) name/avatar lookups in lists. */
export function useMemberMap(members: GroupMember[]): Map<string, GroupMember> {
  return useMemo(() => {
    const map = new Map<string, GroupMember>();
    for (const m of members) map.set(m.id, m);
    return map;
  }, [members]);
}

/** The other person in a 1:1 buddy pair (for titles, cards, settle defaults). */
export function otherParticipant(
  group: Group,
  uid: string,
): { id: string; displayName: string; photoURL?: string | null } | null {
  if (group.kind !== 'direct') return null;
  const otherId = group.memberIds.find((m) => m !== uid);
  if (!otherId) return null;
  const info = group.participants?.[otherId];
  return { id: otherId, displayName: info?.displayName ?? 'Buddy', photoURL: info?.photoURL ?? null };
}
