import type { Expense, Settlement } from '@/lib/types';

import {
  computeBalances,
  isAllSettled,
  netBalanceFor,
  simplifyDebts,
  totalOutstanding,
} from './engine';

/** Minimal expense factory — fills the fields the engine actually reads. */
function expense(
  paidBy: [string, number][],
  splits: [string, number][],
  overrides: Partial<Expense> = {},
): Expense {
  return {
    id: Math.random().toString(36).slice(2),
    groupId: 'g1',
    description: 'test',
    amount: paidBy.reduce((a, [, v]) => a + v, 0),
    currency: 'INR',
    paidBy: paidBy.map(([userId, amount]) => ({ userId, amount })),
    splits: splits.map(([userId, amount]) => ({ userId, amount })),
    splitMethod: 'equal',
    createdBy: paidBy[0][0],
    createdAt: Date.now(),
    ...overrides,
  };
}

function settlement(from: string, to: string, amount: number): Settlement {
  return {
    id: Math.random().toString(36).slice(2),
    groupId: 'g1',
    fromUserId: from,
    toUserId: to,
    amount,
    currency: 'INR',
    createdBy: from,
    createdAt: Date.now(),
  };
}

describe('computeBalances', () => {
  it('A pays ₹100 split equally among A,B,C → A is owed 66.66, B & C owe', () => {
    const balances = computeBalances([expense([['A', 10000]], [['A', 3334], ['B', 3333], ['C', 3333]])], []);
    expect(netBalanceFor(balances, 'A')).toBe(6666);
    expect(netBalanceFor(balances, 'B')).toBe(-3333);
    expect(netBalanceFor(balances, 'C')).toBe(-3333);
  });

  it('always nets to zero across all members', () => {
    const balances = computeBalances(
      [
        expense([['A', 9000]], [['A', 3000], ['B', 3000], ['C', 3000]]),
        expense([['B', 6000]], [['A', 2000], ['B', 2000], ['C', 2000]]),
      ],
      [settlement('C', 'A', 1000)],
    );
    expect([...balances.values()].reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('settlement moves a debtor toward zero', () => {
    const expenses = [expense([['A', 10000]], [['A', 0], ['B', 10000]])]; // B owes A 100
    const before = computeBalances(expenses, []);
    expect(netBalanceFor(before, 'B')).toBe(-10000);

    const after = computeBalances(expenses, [settlement('B', 'A', 10000)]);
    expect(netBalanceFor(after, 'B')).toBe(0);
    expect(netBalanceFor(after, 'A')).toBe(0);
    expect(isAllSettled(after)).toBe(true);
  });

  it('ignores soft-deleted expenses', () => {
    const balances = computeBalances(
      [expense([['A', 5000]], [['B', 5000]], { deletedAt: Date.now() })],
      [],
    );
    expect(isAllSettled(balances)).toBe(true);
  });

  it('supports multiple payers on one expense', () => {
    const balances = computeBalances(
      [expense([['A', 6000], ['B', 4000]], [['A', 5000], ['B', 5000]])],
      [],
    );
    expect(netBalanceFor(balances, 'A')).toBe(1000);
    expect(netBalanceFor(balances, 'B')).toBe(-1000);
  });
});

describe('simplifyDebts', () => {
  it('settles a simple debt in one transfer', () => {
    const balances = new Map([
      ['A', 10000],
      ['B', -10000],
    ]);
    expect(simplifyDebts(balances)).toEqual([{ from: 'B', to: 'A', amount: 10000 }]);
  });

  it('produces at most n−1 transfers and conserves money', () => {
    const balances = new Map([
      ['A', 5000],
      ['B', 3000],
      ['C', -2000],
      ['D', -6000],
    ]);
    const transfers = simplifyDebts(balances);
    expect(transfers.length).toBeLessThanOrEqual(3);

    // Applying the transfers must zero everyone out.
    const result = new Map(balances);
    for (const t of transfers) {
      result.set(t.from, (result.get(t.from) ?? 0) + t.amount);
      result.set(t.to, (result.get(t.to) ?? 0) - t.amount);
    }
    for (const v of result.values()) expect(v).toBe(0);
  });

  it('returns nothing when everyone is settled', () => {
    expect(simplifyDebts(new Map([['A', 0], ['B', 0]]))).toEqual([]);
  });
});

describe('totalOutstanding', () => {
  it('sums only the positive (creditor) side', () => {
    const balances = new Map([
      ['A', 5000],
      ['B', 3000],
      ['C', -8000],
    ]);
    expect(totalOutstanding(balances)).toBe(8000);
  });
});
