import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brandmark } from '@/components/Brandmark';
import { Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme/useTheme';

export interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();

  return (
    <View className="flex-1 bg-canvas">
      {/* Warm marigold glow for atmosphere behind the hero. */}
      <LinearGradient
        colors={[withAlpha(colors.accent, scheme === 'dark' ? 0.16 : 0.22), withAlpha(colors.accent, 0)]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 340 }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 36,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
          }}
        >
          <Brandmark size="lg" />
          <View className="mb-8 mt-12">
            <Text variant="display" className="mb-2">
              {title}
            </Text>
            <Text variant="body" className="text-muted">
              {subtitle}
            </Text>
          </View>
          {children}
          <View className="flex-1" />
          {footer ? <View className="mt-8">{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
