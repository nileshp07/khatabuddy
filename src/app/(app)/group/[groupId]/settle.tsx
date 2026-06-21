import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { Avatar, Button, Screen, ScreenHeader, Text } from '@/components/ui';
import { createSettlement } from '@/features/expenses/service';
import { useContainerMembers, useGroup } from '@/features/groups/hooks';
import { cn } from '@/lib/cn';
import { minorToMajor, parseAmountToMinor } from '@/lib/money';
import { useSession } from '@/store/session';
import { toast } from '@/store/ui';
import { useTheme } from '@/theme/useTheme';

export default function SettleScreen() {
  const { groupId, to, amount } = useLocalSearchParams<{ groupId: string; to?: string; amount?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const uid = useSession((s) => s.uid) ?? '';

  const { data: group } = useGroup(groupId);
  const { data: members } = useContainerMembers(group);
  const currency = group?.currency ?? 'INR';

  const [toUser, setToUser] = useState<string>(to ?? '');
  const [amountText, setAmountText] = useState('');

  // Prefill the amount from the suggested settle-up once we know the currency.
  useEffect(() => {
    if (amount && group) setAmountText(String(minorToMajor(Number(amount), currency)));
  }, [amount, group, currency]);

  const totalMinor = useMemo(() => parseAmountToMinor(amountText, currency) ?? 0, [amountText, currency]);
  const recipients = members.filter((m) => m.id !== uid);
  const canSave = toUser !== '' && toUser !== uid && totalMinor > 0;

  const onSave = async () => {
    if (!canSave || !group) return;
    try {
      await createSettlement({
        groupId,
        fromUserId: uid,
        toUserId: toUser,
        amount: totalMinor,
        currency,
        createdBy: uid,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast.success('Payment recorded');
      router.back();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not record the payment.');
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Settle up" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 22 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="body" className="text-muted">
          Record a payment you made to another member. This updates everyone’s balances.
        </Text>

        {/* Amount */}
        <View className="items-center gap-1 py-2">
          <Text variant="caption">You paid ({currency})</Text>
          <TextInput
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            className="text-center font-display text-5xl text-ink"
            style={{ minWidth: 160 }}
          />
        </View>

        {/* Recipient */}
        <View className="gap-3">
          <Text variant="label" className="text-muted">
            Paid to
          </Text>
          {recipients.length === 0 ? (
            <Text variant="caption">You’re the only member so far — invite someone to settle up.</Text>
          ) : (
            recipients.map((m) => {
              const selected = toUser === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setToUser(m.id)}
                  className={cn(
                    'flex-row items-center gap-3 rounded-2xl border p-3 active:scale-[0.99]',
                    selected ? 'border-primary bg-primary/10' : 'border-line bg-surface',
                  )}
                >
                  <Avatar name={m.displayName} uri={m.photoURL} size={40} />
                  <Text variant="heading" className="flex-1">
                    {m.displayName}
                  </Text>
                  {selected ? <Feather name="check-circle" size={20} color={colors.primary} /> : null}
                </Pressable>
              );
            })
          )}
        </View>

        <Button label="Record payment" size="lg" disabled={!canSave} onPress={onSave} />
      </ScrollView>
    </Screen>
  );
}
