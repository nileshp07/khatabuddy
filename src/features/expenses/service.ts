/**
 * Expense + settlement writes. The `splits` array is embedded on the expense and
 * written atomically, and the core invariant — sum(splits) === sum(paidBy) ===
 * amount — is asserted here before the write (and again in security rules, so a
 * client can never persist an unbalanced ledger entry).
 */
import { addDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';

import { expensesCol, expenseDoc, settlementsCol } from '@/lib/firebase/refs';
import { sum } from '@/lib/money';
import type { PaidByEntry, SplitEntry, SplitMethod } from '@/lib/types';

export interface CreateExpenseInput {
  groupId: string;
  description: string;
  category?: string;
  currency: string;
  amount: number; // minor units
  paidBy: PaidByEntry[];
  splits: SplitEntry[];
  splitMethod: SplitMethod;
  createdBy: string;
}

function assertBalanced(input: CreateExpenseInput): void {
  if (input.amount <= 0) throw new Error('Amount must be greater than zero.');
  if (sum(input.paidBy.map((p) => p.amount)) !== input.amount) {
    throw new Error('Payments must add up to the total.');
  }
  if (sum(input.splits.map((s) => s.amount)) !== input.amount) {
    throw new Error('Splits must add up to the total.');
  }
}

export async function createExpense(input: CreateExpenseInput): Promise<string> {
  assertBalanced(input);
  const ref = await addDoc(expensesCol(input.groupId), {
    id: '', // overwritten by Firestore doc id on read via the converter
    groupId: input.groupId,
    description: input.description,
    category: input.category ?? 'general',
    amount: input.amount,
    currency: input.currency,
    paidBy: input.paidBy,
    splits: input.splits,
    splitMethod: input.splitMethod,
    createdBy: input.createdBy,
    // Client timestamp (not serverTimestamp) so the expense appears immediately
    // in the orderBy('createdAt') feed under latency compensation / offline.
    createdAt: Timestamp.now(),
    deletedAt: null,
  } as never);
  return ref.id;
}

/** Soft delete — financial records are never hard-deleted, keeping history sound. */
export async function softDeleteExpense(groupId: string, expenseId: string): Promise<void> {
  await updateDoc(expenseDoc(groupId, expenseId), {
    deletedAt: serverTimestamp(),
  } as never);
}

export interface CreateSettlementInput {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  note?: string;
  createdBy: string;
}

export async function createSettlement(input: CreateSettlementInput): Promise<string> {
  if (input.amount <= 0) throw new Error('Settlement amount must be positive.');
  if (input.fromUserId === input.toUserId) throw new Error('Pick a different person.');
  const ref = await addDoc(settlementsCol(input.groupId), {
    id: '',
    groupId: input.groupId,
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    amount: input.amount,
    currency: input.currency,
    note: input.note ?? '',
    createdBy: input.createdBy,
    createdAt: Timestamp.now(),
  } as never);
  return ref.id;
}
