import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type GestureResponderEvent,
  type PressableProps,
} from 'react-native';

import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/useTheme';

import { Text, type TextVariant } from './Text';

export type ButtonVariant = 'primary' | 'accent' | 'surface' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT: Record<ButtonVariant, { container: string; label: string; spinner: keyof ReturnType<typeof useTheme>['colors'] }> = {
  primary: { container: 'bg-primary active:opacity-90', label: 'text-primary-ink', spinner: 'primaryInk' },
  accent: { container: 'bg-accent active:opacity-90', label: 'text-accent-ink', spinner: 'accentInk' },
  surface: { container: 'bg-surface border border-line active:opacity-80', label: 'text-ink', spinner: 'ink' },
  ghost: { container: 'bg-transparent active:opacity-60', label: 'text-ink', spinner: 'ink' },
  danger: { container: 'bg-negative active:opacity-90', label: 'text-white', spinner: 'primaryInk' },
};

const SIZE: Record<ButtonSize, { container: string; text: TextVariant }> = {
  sm: { container: 'px-3 py-2 rounded-xl', text: 'label' },
  md: { container: 'px-4 py-3.5 rounded-2xl', text: 'label' },
  lg: { container: 'px-5 py-4 rounded-2xl', text: 'heading' },
};

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  /** Convenience: render a Feather icon (in the label color) before the label. */
  leftIconName?: ComponentProps<typeof Feather>['name'];
  haptic?: boolean;
  className?: string;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  leftIcon,
  leftIconName,
  haptic = true,
  className,
  onPress,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const v = VARIANT[variant];
  const s = SIZE[size];
  const isDisabled = disabled || loading;

  const handlePress = (e: GestureResponderEvent) => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.(e);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      className={cn(
        'flex-row items-center justify-center active:scale-[0.98]',
        v.container,
        s.container,
        isDisabled && 'opacity-50',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors[v.spinner]} />
      ) : (
        <>
          {leftIconName ? (
            <Feather name={leftIconName} size={18} color={colors[v.spinner]} style={{ marginRight: 8 }} />
          ) : leftIcon ? (
            <View className="mr-2">{leftIcon}</View>
          ) : null}
          <Text variant={s.text} className={cn('font-sans-sb', v.label)}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
