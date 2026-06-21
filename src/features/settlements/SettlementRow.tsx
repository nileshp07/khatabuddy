import { Feather } from '@expo/vector-icons';
import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { formatRelativeDate } from '@/lib/date';
import { formatMoneyAbs } from '@/lib/money';
import type { GroupMember, Settlement } from '@/lib/types';
import { useTheme } from '@/theme/useTheme';

export interface SettlementRowProps {
  settlement: Settlement;
  currency: string;
  memberMap: Map<string, GroupMember>;
  currentUid: string;
}

function firstName(member: GroupMember | undefined, fallback = 'Someone'): string {
  return member?.displayName?.split(' ')[0] ?? fallback;
}

export const SettlementRow = memo(function SettlementRow({
  settlement,
  currency,
  memberMap,
  currentUid,
}: SettlementRowProps) {
  const { colors } = useTheme();
  const from = settlement.fromUserId === currentUid ? 'You' : firstName(memberMap.get(settlement.fromUserId));
  const to = settlement.toUserId === currentUid ? 'you' : firstName(memberMap.get(settlement.toUserId));

  return (
    <View className="flex-row items-center gap-3 py-3">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-positive/15">
        <Feather name="check" size={18} color={colors.positive} />
      </View>
      <View className="flex-1">
        <Text variant="label" numberOfLines={1}>
          {from} paid {to}
        </Text>
        <Text variant="caption">Settled up · {formatRelativeDate(settlement.createdAt)}</Text>
      </View>
      <Text className="font-mono text-muted">{formatMoneyAbs(settlement.amount, currency)}</Text>
    </View>
  );
});
