/**
 * Typed Firestore converters. They do two jobs so the rest of the app never
 * touches the Firestore SDK types:
 *   1. attach the document id onto the model
 *   2. translate Firestore `Timestamp` fields into epoch-ms `number`s
 *
 * On write we strip `id` (it's the document key, not a field) and let the
 * service layer supply `serverTimestamp()` for time fields.
 */
import {
  Timestamp,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore';

import type {
  Expense,
  Group,
  GroupMember,
  Invite,
  Settlement,
  UserProfile,
} from '@/lib/types';

const TIMESTAMP_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'joinedAt',
  'deletedAt',
  'expiresAt',
  'nextRunAt',
]);

function toMillis(value: unknown): unknown {
  return value instanceof Timestamp ? value.toMillis() : value;
}

function makeConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(model) {
      const { id: _id, ...rest } = model as Record<string, unknown>;
      return rest;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): T {
      const data = snapshot.data(options) as Record<string, unknown>;
      const out: Record<string, unknown> = { id: snapshot.id };
      for (const [key, value] of Object.entries(data)) {
        out[key] = TIMESTAMP_FIELDS.has(key) ? toMillis(value) : value;
      }
      return out as T;
    },
  };
}

export const userConverter = makeConverter<UserProfile>();
export const groupConverter = makeConverter<Group>();
export const memberConverter = makeConverter<GroupMember>();
export const expenseConverter = makeConverter<Expense>();
export const settlementConverter = makeConverter<Settlement>();
export const inviteConverter = makeConverter<Invite>();
