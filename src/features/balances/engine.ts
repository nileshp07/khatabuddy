/**
 * Balance engine — pure functions, zero Firebase imports.
 *
 * Balances are *derived* from the append-only ledger (expenses + settlements),
 * never stored. This keeps offline/optimistic writes conflict-free and makes the
 * whole engine trivially unit-testable.
 *
 * Convention: a member's net balance is
 *     (total they paid) − (total they consumed) − (net they were paid back)
 * so a **positive** balance means the group owes them (creditor) and a
 * **negative** balance means they owe the group (debtor). The sum across all
 * members is always zero.
 */

import type { Expense, Settlement, Transfer } from '@/lib/types';

export type BalanceMap = Map<string, number>;

function add(map: BalanceMap, userId: string, delta: number): void {
  map.set(userId, (map.get(userId) ?? 0) + delta);
}

/**
 * Reduce the ledger to per-member net balances.
 * Soft-deleted expenses (deletedAt set) are skipped.
 */
export function computeBalances(expenses: Expense[], settlements: Settlement[]): BalanceMap {
  const balances: BalanceMap = new Map();

  for (const expense of expenses) {
    if (expense.deletedAt) continue;
    for (const payer of expense.paidBy) add(balances, payer.userId, payer.amount);
    for (const split of expense.splits) add(balances, split.userId, -split.amount);
  }

  for (const s of settlements) {
    // The payer settles part of their debt (+); the payee's credit shrinks (−).
    add(balances, s.fromUserId, s.amount);
    add(balances, s.toUserId, -s.amount);
  }

  return balances;
}

/** Net balance for one member (positive = owed to them, negative = they owe). */
export function netBalanceFor(balances: BalanceMap, userId: string): number {
  return balances.get(userId) ?? 0;
}

/** Sum of all positive balances — the total amount "in flight" in the group. */
export function totalOutstanding(balances: BalanceMap): number {
  let total = 0;
  for (const amount of balances.values()) if (amount > 0) total += amount;
  return total;
}

/** True when every balance is zero (or no balances yet) — the celebrate moment. */
export function isAllSettled(balances: BalanceMap): boolean {
  for (const amount of balances.values()) if (amount !== 0) return false;
  return true;
}

/**
 * Minimize the number of settle-up transactions (min-cash-flow).
 *
 * Greedy: pair the largest creditor against the largest debtor, settle the
 * smaller of the two, and repeat. Producing the provably-minimal set is
 * NP-hard, but this heuristic yields at most n−1 transfers and is what every
 * practical splitter ships. Runs client-side: it's a cheap pure function over
 * already-loaded balances, works offline, and needs no server round-trip.
 *
 * `epsilon` ignores residual sub-unit balances (defensive; balances are
 * integers so this is normally 0).
 */
export function simplifyDebts(balances: BalanceMap, epsilon = 0): Transfer[] {
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, amount] of balances) {
    if (amount > epsilon) creditors.push({ userId, amount });
    else if (amount < -epsilon) debtors.push({ userId, amount: -amount });
  }

  // Largest first → fewer, bigger transfers.
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const pay = Math.min(creditor.amount, debtor.amount);

    if (pay > 0) {
      transfers.push({ from: debtor.userId, to: creditor.userId, amount: pay });
    }

    creditor.amount -= pay;
    debtor.amount -= pay;
    if (creditor.amount <= epsilon) i++;
    if (debtor.amount <= epsilon) j++;
  }

  return transfers;
}

/** The simplified transfers that involve a specific member (for their detail view). */
export function transfersForUser(transfers: Transfer[], userId: string): Transfer[] {
  return transfers.filter((t) => t.from === userId || t.to === userId);
}
