import { orderBy, query } from 'firebase/firestore';
import { useMemo } from 'react';

import { expensesCol, settlementsCol } from '@/lib/firebase/refs';
import { useCollection } from '@/lib/hooks/useFirestore';
import type { Expense, Settlement, Transfer } from '@/lib/types';

import { computeBalances, simplifyDebts, type BalanceMap } from './engine';

export interface LedgerState {
  expenses: Expense[];
  settlements: Settlement[];
  balances: BalanceMap;
  transfers: Transfer[];
  loading: boolean;
  pending: boolean;
  error: Error | null;
}

/**
 * Subscribes to a group's expenses + settlements and derives balances and the
 * simplified settle-up plan client-side. Balances are never stored — recomputed
 * from the live ledger on every snapshot.
 */
export function useLedger(groupId: string): LedgerState {
  const expensesQuery = useMemo(
    () => query(expensesCol(groupId), orderBy('createdAt', 'desc')),
    [groupId],
  );
  const settlementsQuery = useMemo(
    () => query(settlementsCol(groupId), orderBy('createdAt', 'desc')),
    [groupId],
  );

  const expenses = useCollection(expensesQuery);
  const settlements = useCollection(settlementsQuery);

  const balances = useMemo(
    () => computeBalances(expenses.data, settlements.data),
    [expenses.data, settlements.data],
  );
  const transfers = useMemo(() => simplifyDebts(balances), [balances]);

  return {
    expenses: expenses.data,
    settlements: settlements.data,
    balances,
    transfers,
    loading: expenses.loading || settlements.loading,
    pending: expenses.hasPendingWrites || settlements.hasPendingWrites,
    error: expenses.error ?? settlements.error,
  };
}
