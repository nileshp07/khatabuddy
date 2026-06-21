import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';

export type TextVariant =
  | 'display' // Fraunces bold — hero balances
  | 'title' // Fraunces semibold — section/screen titles
  | 'heading' // Geist semibold — card headings
  | 'body' // Geist regular — default copy
  | 'label' // Geist medium — form labels, list rows
  | 'caption' // muted small print
  | 'mono'; // Geist Mono — tabular figures

const VARIANTS: Record<TextVariant, string> = {
  display: 'font-display text-ink text-4xl',
  title: 'font-display-md text-ink text-2xl',
  heading: 'font-sans-sb text-ink text-lg',
  body: 'font-sans text-ink text-base leading-6',
  label: 'font-sans-md text-ink text-sm',
  caption: 'font-sans text-muted text-xs',
  mono: 'font-mono text-ink text-base',
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
}

export function Text({ variant = 'body', className, ...rest }: TextProps) {
  return <RNText className={cn(VARIANTS[variant], className)} {...rest} />;
}
