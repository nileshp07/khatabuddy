import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';

import {
  AmountText,
  Avatar,
  Badge,
  Button,
  Card,
  Screen,
  ScreenHeader,
  Skeleton,
  Text,
} from '@/components/ui';
import { categoryIcon } from '@/features/expenses/categories';
import { softDeleteExpense } from '@/features/expenses/service';
import { useContainerMembers, useGroup, useMemberMap } from '@/features/groups/hooks';
import { expenseDoc } from '@/lib/firebase/refs';
import { useDoc } from '@/lib/hooks/useFirestore';
import { formatRelativeDate } from '@/lib/date';
import { formatMoneyAbs, sum } from '@/lib/money';
import type { GroupMember } from '@/lib/types';
import { useSession } from '@/store/session';
import { toast } from '@/store/ui';
import { useTheme } from '@/theme/useTheme';

const SPLIT_LABEL = { equal: 'Split equally', exact: 'Custom amounts', percent: 'By percentage' } as const;

export default function ExpenseDetailScreen() {
  const { groupId, expenseId } = useLocalSearchParams<{ groupId: string; expenseId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const uid = useSession((s) => s.uid) ?? '';

  const { data: group } = useGroup(groupId);
  const { data: members } = useContainerMembers(group);
  const memberMap = useMemberMap(members);
  const { data: expense, loading } = useDoc(expenseDoc(groupId, expenseId));

  const currency = group?.currency ?? 'INR';
  const name = (m: GroupMember | undefined, id: string) =>
    id === uid ? 'You' : (m?.displayName ?? 'Someone');

  const onDelete = () => {
    Alert.alert('Delete expense?', 'This removes it from the ledger and recomputes balances.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await softDeleteExpense(groupId, expenseId);
            toast.success('Expense deleted');
            router.back();
          } catch {
            toast.error('Could not delete the expense.');
          }
        },
      },
    ]);
  };

  if (loading && !expense) {
    return (
      <Screen>
        <ScreenHeader title="Expense" onBack={() => router.back()} />
        <View className="gap-4 px-5 pt-2">
          <Skeleton height={120} radius={24} />
          <Skeleton height={160} radius={24} />
        </View>
      </Screen>
    );
  }

  if (!expense || expense.deletedAt) {
    return (
      <Screen>
        <ScreenHeader title="Expense" onBack={() => router.back()} />
        <View className="items-center gap-1 px-5 pt-16">
          <Text variant="title">Expense not found</Text>
          <Text variant="caption">It may have been deleted.</Text>
        </View>
      </Screen>
    );
  }

  const paid = sum(expense.paidBy.filter((p) => p.userId === uid).map((p) => p.amount));
  const owed = sum(expense.splits.filter((s) => s.userId === uid).map((s) => s.amount));
  const net = paid - owed;
  const canDelete = expense.createdBy === uid;

  return (
    <Screen>
      <ScreenHeader title="Expense" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 18 }}>
        {/* Header card */}
        <Card className="items-center gap-2 py-6">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-sunken">
            <Feather name={categoryIcon(expense.category)} size={24} color={colors.accent} />
          </View>
          <Text variant="title" className="text-center">
            {expense.description}
          </Text>
          <Text className="font-mono-sb text-3xl text-ink">
            {formatMoneyAbs(expense.amount, currency)}
          </Text>
          <Text variant="caption">{formatRelativeDate(expense.createdAt)}</Text>
          <Badge label={SPLIT_LABEL[expense.splitMethod]} tone="neutral" />
        </Card>

        {/* Your effect */}
        <View className="flex-row items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3">
          <Text variant="label">{net > 0 ? 'You get back' : net < 0 ? 'You owe' : 'You’re even'}</Text>
          {net === 0 ? (
            <Text className="font-mono text-muted">—</Text>
          ) : (
            <AmountText minor={net} currency={currency} />
          )}
        </View>

        {/* Paid by */}
        <View className="gap-2">
          <Text variant="label" className="text-muted">
            Paid by
          </Text>
          {expense.paidBy.map((p) => (
            <View key={p.userId} className="flex-row items-center gap-3 py-1">
              <Avatar name={memberMap.get(p.userId)?.displayName ?? '?'} uri={memberMap.get(p.userId)?.photoURL} size={36} />
              <Text variant="label" className="flex-1">
                {name(memberMap.get(p.userId), p.userId)}
              </Text>
              <Text className="font-mono text-ink">{formatMoneyAbs(p.amount, currency)}</Text>
            </View>
          ))}
        </View>

        {/* Each share */}
        <View className="gap-2">
          <Text variant="label" className="text-muted">
            Each person’s share
          </Text>
          {expense.splits.map((s) => {
            const pct = expense.amount > 0 ? Math.round((s.amount / expense.amount) * 100) : 0;
            return (
              <View key={s.userId} className="flex-row items-center gap-3 py-1">
                <Avatar name={memberMap.get(s.userId)?.displayName ?? '?'} uri={memberMap.get(s.userId)?.photoURL} size={36} />
                <Text variant="label" className="flex-1">
                  {name(memberMap.get(s.userId), s.userId)}
                </Text>
                <Text variant="caption" className="mr-3">
                  {pct}%
                </Text>
                <Text className="font-mono text-ink">{formatMoneyAbs(s.amount, currency)}</Text>
              </View>
            );
          })}
        </View>

        {canDelete ? (
          <Button label="Delete expense" variant="surface" leftIconName="trash-2" onPress={onDelete} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
