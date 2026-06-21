import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Text } from './ui/Text';

export interface BrandmarkProps {
  size?: 'sm' | 'lg';
  showWordmark?: boolean;
}

/** The KhataBuddy mark: a marigold ledger tile + serif wordmark with an accent dot. */
export function Brandmark({ size = 'sm', showWordmark = true }: BrandmarkProps) {
  const { colors } = useTheme();
  const tile = size === 'lg' ? 56 : 40;
  return (
    <View className="flex-row items-center gap-3">
      <View
        className="items-center justify-center bg-accent"
        style={{ width: tile, height: tile, borderRadius: tile * 0.32 }}
      >
        <Feather name="book-open" size={tile * 0.5} color={colors.accentInk} />
      </View>
      {showWordmark ? (
        <Text className={size === 'lg' ? 'font-display text-3xl text-ink' : 'font-display text-xl text-ink'}>
          Khata<Text className="text-accent">buddy</Text>
        </Text>
      ) : null}
    </View>
  );
}
