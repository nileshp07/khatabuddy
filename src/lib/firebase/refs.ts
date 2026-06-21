/**
 * Centralized, typed Firestore references. Every collection/doc is created with
 * its converter attached, so reads come back as fully-typed domain models and
 * writes are checked against them.
 */
import { collection, doc } from 'firebase/firestore';

import {
  expenseConverter,
  groupConverter,
  inviteConverter,
  memberConverter,
  settlementConverter,
  userConverter,
} from './converters';
import { db } from './init';

// Users
export const usersCol = () => collection(db, 'users').withConverter(userConverter);
export const userDoc = (uid: string) => doc(db, 'users', uid).withConverter(userConverter);

// Groups
export const groupsCol = () => collection(db, 'groups').withConverter(groupConverter);
export const groupDoc = (groupId: string) =>
  doc(db, 'groups', groupId).withConverter(groupConverter);

// Members (subcollection)
export const membersCol = (groupId: string) =>
  collection(db, 'groups', groupId, 'members').withConverter(memberConverter);
export const memberDoc = (groupId: string, uid: string) =>
  doc(db, 'groups', groupId, 'members', uid).withConverter(memberConverter);

// Expenses (subcollection)
export const expensesCol = (groupId: string) =>
  collection(db, 'groups', groupId, 'expenses').withConverter(expenseConverter);
export const expenseDoc = (groupId: string, expenseId: string) =>
  doc(db, 'groups', groupId, 'expenses', expenseId).withConverter(expenseConverter);

// Settlements (subcollection)
export const settlementsCol = (groupId: string) =>
  collection(db, 'groups', groupId, 'settlements').withConverter(settlementConverter);

// Invites (top-level, keyed by code)
export const inviteDoc = (code: string) =>
  doc(db, 'invites', code).withConverter(inviteConverter);
