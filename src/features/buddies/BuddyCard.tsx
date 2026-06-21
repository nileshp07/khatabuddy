import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { AmountText, Avatar, Card, Text } from '@/components/ui';
import { netBalanceFor } from '@/features/balances/engine';
import { useLedger } from '@/features/balances/hooks';
import { otherParticipant } from '@/features/groups/hooks';
import type { Group } from '@/lib/types';
import { useTheme } from '@/theme/useTheme';

export interface BuddyCardProps {
  group: Group; // a direct (kind:'direct') container
  currentUid: string;
  onPress: () => void;
  onNet?: (groupId: string, net: number, currency: string) => void;
}

export function BuddyCard({ group, currentUid, onPress, onNet }: BuddyCardProps) {
  const { colors } = useTheme();
  const buddy = otherParticipant(group, currentUid);
  const { balances } = useLedger(group.id);
  const net = netBalanceFor(balances, currentUid);

  useEffect(() => {
    onNet?.(group.id, net, group.currency);
  }, [group.id, net, group.currency, onNet]);

  return (
    <Pressable onPress={onPress} className="active:scale-[0.99]">
      <Card className="flex-row items-center gap-4">
        <Avatar name={buddy?.displayName ?? 'Buddy'} uri={buddy?.photoURL} size={48} />
        <View className="flex-1">
          <Text variant="heading" numberOfLines={1}>
            {buddy?.displayName ?? 'Buddy'}
          </Text>
          <Text variant="caption">buddy</Text>
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
        <Feather name="chevron-right" size={18} color={colors.muted} />
      </Card>
    </Pressable>
  );
}
