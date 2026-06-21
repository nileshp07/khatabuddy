import { View } from 'react-native';

import { AmountText, Avatar, Button, Card, Text } from '@/components/ui';
import type { GroupMember, Transfer } from '@/lib/types';

export interface SettleSuggestionsProps {
  transfers: Transfer[];
  currentUid: string;
  currency: string;
  memberMap: Map<string, GroupMember>;
  onSettle: (toUserId: string, amount: number) => void;
}

/**
 * Shows the minimized settle-up plan, filtered to the rows that involve the
 * current user. Rows the user owes get a one-tap "Settle" CTA.
 */
export function SettleSuggestions({
  transfers,
  currentUid,
  currency,
  memberMap,
  onSettle,
}: SettleSuggestionsProps) {
  const mine = transfers.filter((t) => t.from === currentUid || t.to === currentUid);
  if (mine.length === 0) return null;

  return (
    <View className="gap-2">
      <Text variant="label" className="text-muted">
        Suggested settle-ups
      </Text>
      {mine.map((t) => {
        const youPay = t.from === currentUid;
        const other = memberMap.get(youPay ? t.to : t.from);
        const name = other?.displayName?.split(' ')[0] ?? 'Someone';
        return (
          <Card key={`${t.from}-${t.to}`} className="flex-row items-center gap-3">
            <Avatar name={other?.displayName ?? '?'} uri={other?.photoURL} size={38} />
            <View className="flex-1">
              <Text variant="label">{youPay ? `You owe ${name}` : `${name} owes you`}</Text>
              <AmountText minor={youPay ? -t.amount : t.amount} currency={currency} />
            </View>
            {youPay ? (
              <Button label="Settle" size="sm" onPress={() => onSettle(t.to, t.amount)} />
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}
