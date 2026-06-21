import { useMemo } from 'react';
import { View } from 'react-native';

import { StatTile, Text } from '@/components/ui';
import { formatMoneyAbs, sum } from '@/lib/money';
import type { Expense } from '@/lib/types';

export interface GroupStatsProps {
  expenses: Expense[];
  currency: string;
  currentUid: string;
}

/** Group-level totals that make the ledger easy to audit at a glance. */
export function GroupStats({ expenses, currency, currentUid }: GroupStatsProps) {
  const stats = useMemo(() => {
    const live = expenses.filter((e) => !e.deletedAt);
    const totalSpent = sum(live.map((e) => e.amount));
    const youPaid = sum(
      live.flatMap((e) => e.paidBy.filter((p) => p.userId === currentUid).map((p) => p.amount)),
    );
    const yourShare = sum(
      live.flatMap((e) => e.splits.filter((s) => s.userId === currentUid).map((s) => s.amount)),
    );
    return { totalSpent, youPaid, yourShare, count: live.length };
  }, [expenses, currentUid]);

  if (stats.count === 0) return null;

  return (
    <View className="gap-3">
      <Text variant="label" className="text-muted">
        Group overview
      </Text>
      <View className="flex-row gap-3">
        <StatTile
          label="Total spent"
          value={formatMoneyAbs(stats.totalSpent, currency)}
          hint={`${stats.count} ${stats.count === 1 ? 'expense' : 'expenses'}`}
        />
        <StatTile label="You paid" value={formatMoneyAbs(stats.youPaid, currency)} />
        <StatTile label="Your share" value={formatMoneyAbs(stats.yourShare, currency)} />
      </View>
    </View>
  );
}
