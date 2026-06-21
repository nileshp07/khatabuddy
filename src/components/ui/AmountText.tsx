import { cn } from '@/lib/cn';
import { formatMoney, formatMoneyAbs } from '@/lib/money';

import { Text } from './Text';

export interface AmountTextProps {
  minor: number;
  currency: string;
  /** Show +/- sign and color by sign (default). When false, shows absolute value in ink. */
  signed?: boolean;
  className?: string;
}

/** Tabular, sign-aware money. Green = owed to you, clay-red = you owe. */
export function AmountText({ minor, currency, signed = true, className }: AmountTextProps) {
  const tone = !signed ? 'text-ink' : minor > 0 ? 'text-positive' : minor < 0 ? 'text-negative' : 'text-muted';
  const text = signed
    ? formatMoney(minor, currency, { signDisplay: 'exceptZero' })
    : formatMoneyAbs(minor, currency);
  return <Text className={cn('font-mono', tone, className)}>{text}</Text>;
}
