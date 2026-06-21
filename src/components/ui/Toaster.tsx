import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';

import { useTheme } from '@/theme/useTheme';
import { useToastStore, type ToastType } from '@/store/ui';

import { Text } from './Text';

const ICON: Record<ToastType, ComponentProps<typeof Feather>['name']> = {
  success: 'check-circle',
  error: 'alert-triangle',
  info: 'info',
};

const ACCENT: Record<ToastType, keyof ReturnType<typeof useTheme>['colors']> = {
  success: 'positive',
  error: 'negative',
  info: 'accent',
};

/** Renders the global toast queue. Mount once near the app root. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-50 gap-2 px-4"
      style={{ top: insets.top + 8 }}
    >
      {toasts.map((t) => (
        <Animated.View
          key={t.id}
          entering={FadeInUp.springify().damping(18)}
          exiting={FadeOutUp.duration(200)}
          layout={LinearTransition.springify()}
          className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-lg"
        >
          <Feather name={ICON[t.type]} size={18} color={colors[ACCENT[t.type]]} />
          <Text className="flex-1 font-sans-md text-ink">{t.message}</Text>
        </Animated.View>
      ))}
    </View>
  );
}
