import { View } from 'react-native';

import { cn } from '@/lib/cn';

import { Text } from './Text';

export type StatTone = 'default' | 'positive' | 'negative' | 'muted';

export interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  tone?: StatTone;
  className?: string;
}

const TONE: Record<StatTone, string> = {
  default: 'text-ink',
  positive: 'text-positive',
  negative: 'text-negative',
  muted: 'text-muted',
};

export function StatTile({ label, value, hint, tone = 'default', className }: StatTileProps) {
  return (
    <View className={cn('flex-1 gap-1 rounded-2xl border border-line bg-surface p-3', className)}>
      <Text variant="caption">{label}</Text>
      <Text className={cn('font-mono-sb text-base', TONE[tone])} numberOfLines={1}>
        {value}
      </Text>
      {hint ? <Text variant="caption">{hint}</Text> : null}
    </View>
  );
}
