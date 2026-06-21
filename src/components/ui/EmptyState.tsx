import { Feather } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Text } from './Text';

export interface EmptyStateProps {
  icon?: ComponentProps<typeof Feather>['name'];
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'inbox', title, subtitle, action }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-3xl bg-sunken">
        <Feather name={icon} size={30} color={colors.accent} />
      </View>
      <Text variant="title" className="mb-2 text-center">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" className="mb-6 max-w-xs text-center text-muted">
          {subtitle}
        </Text>
      ) : null}
      {action}
    </View>
  );
}
