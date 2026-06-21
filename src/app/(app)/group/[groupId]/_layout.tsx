import { Stack } from 'expo-router';

import { useTheme } from '@/theme/useTheme';

export default function GroupLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="expense/[expenseId]" />
      <Stack.Screen name="members" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-expense" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settle" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
