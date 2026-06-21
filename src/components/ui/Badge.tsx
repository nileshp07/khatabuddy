import { View } from 'react-native';

import { cn } from '@/lib/cn';

import { Text } from './Text';

export type BadgeTone = 'neutral' | 'positive' | 'negative' | 'accent' | 'primary';

const TONE: Record<BadgeTone, { bg: string; text: string }> = {
  neutral: { bg: 'bg-sunken', text: 'text-muted' },
  positive: { bg: 'bg-positive/15', text: 'text-positive' },
  negative: { bg: 'bg-negative/15', text: 'text-negative' },
  accent: { bg: 'bg-accent/15', text: 'text-accent' },
  primary: { bg: 'bg-primary/15', text: 'text-primary' },
};

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ label, tone = 'neutral', className }: BadgeProps) {
  const t = TONE[tone];
  return (
    <View className={cn('self-start rounded-full px-2.5 py-1', t.bg, className)}>
      <Text className={cn('font-sans-sb text-xs uppercase tracking-wide', t.text)}>{label}</Text>
    </View>
  );
}
