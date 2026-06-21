import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';

import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/useTheme';

export interface IconButtonProps {
  icon: ComponentProps<typeof Feather>['name'];
  onPress?: (e: GestureResponderEvent) => void;
  variant?: 'surface' | 'ghost' | 'primary';
  size?: number;
  accessibilityLabel?: string;
  className?: string;
}

const VARIANT = {
  surface: { container: 'bg-surface border border-line', color: 'ink' as const },
  ghost: { container: 'bg-transparent', color: 'ink' as const },
  primary: { container: 'bg-primary', color: 'primaryInk' as const },
};

export function IconButton({
  icon,
  onPress,
  variant = 'surface',
  size = 20,
  accessibilityLabel,
  className,
}: IconButtonProps) {
  const { colors } = useTheme();
  const v = VARIANT[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={(e) => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      className={cn('h-11 w-11 items-center justify-center rounded-2xl active:scale-95', v.container, className)}
    >
      <Feather name={icon} size={size} color={colors[v.color]} />
    </Pressable>
  );
}
