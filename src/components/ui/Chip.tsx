import { Pressable } from 'react-native';

import { cn } from '@/lib/cn';

import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        'rounded-full border px-4 py-2 active:scale-95',
        selected ? 'border-primary bg-primary' : 'border-line bg-surface',
      )}
    >
      <Text className={cn('font-sans-sb text-sm', selected ? 'text-primary-ink' : 'text-ink')}>
        {label}
      </Text>
    </Pressable>
  );
}
