import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { AmountText, Card, Text } from '@/components/ui';
import { netBalanceFor } from '@/features/balances/engine';
import { useLedger } from '@/features/balances/hooks';
import type { Group } from '@/lib/types';
import { useTheme } from '@/theme/useTheme';

import { GROUP_TYPE_META } from './meta';

export interface GroupCardProps {
  group: Group;
  currentUid: string;
  onPress: () => void;
  /** Report this group's net (for the home overall summary). */
  onNet?: (groupId: string, net: number, currency: string) => void;
}

export function GroupCard({ group, currentUid, onPress, onNet }: GroupCardProps) {
  const { colors } = useTheme();
  const meta = GROUP_TYPE_META[group.type];
  const memberCount = group.memberIds.length;

  const { balances } = useLedger(group.id);
  const net = netBalanceFor(balances, currentUid);

  useEffect(() => {
    onNet?.(group.id, net, group.currency);
  }, [group.id, net, group.currency, onNet]);

  return (
    <Pressable onPress={onPress} className="active:scale-[0.99]">
      <Card className="flex-row items-center gap-4">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-sunken">
          <Feather name={meta.icon} size={22} color={colors.accent} />
        </View>
        <View className="flex-1">
          <Text variant="heading" numberOfLines={1}>
            {group.name}
          </Text>
          <Text variant="caption">
            {meta.label} · {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </Text>
        </View>
        <View className="items-end">
          {net === 0 ? (
            <Text variant="caption" className="text-muted">
              settled
            </Text>
          ) : (
            <>
              <AmountText minor={net} currency={group.currency} />
              <Text variant="caption">{net > 0 ? 'you’re owed' : 'you owe'}</Text>
            </>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
