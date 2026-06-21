import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import { formatMoneyAbs } from '@/lib/money';
import { useTheme } from '@/theme/useTheme';

export interface BalanceHeroProps {
  /** Current user's net balance in the group (+ owed to you, − you owe). */
  net: number;
  currency: string;
}

export function BalanceHero({ net, currency }: BalanceHeroProps) {
  const { colors } = useTheme();
  const settled = net === 0;
  const owe = net < 0;
  const accent = settled ? colors.primary : owe ? colors.negative : colors.positive;
  const label = settled ? 'Everyone’s squared up' : owe ? 'You owe in total' : 'You are owed in total';

  return (
    <View className="overflow-hidden rounded-3xl border border-line">
      <LinearGradient
        colors={[withAlpha(accent, 0.2), withAlpha(accent, 0.05)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 24 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text variant="caption">{label}</Text>
            <Animated.View key={settled ? 'settled' : owe ? 'owe' : 'owed'} entering={FadeIn.duration(280)}>
              <Text variant="display" style={{ color: accent, marginTop: 6 }}>
                {settled ? 'All clear 🎉' : formatMoneyAbs(Math.abs(net), currency)}
              </Text>
            </Animated.View>
          </View>
          <View
            className="h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: withAlpha(accent, 0.18) }}
          >
            <Feather
              name={settled ? 'check-circle' : owe ? 'arrow-up-right' : 'arrow-down-left'}
              size={26}
              color={accent}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
