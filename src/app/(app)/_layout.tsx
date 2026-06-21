import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

import { Brandmark } from '@/components/Brandmark';
import { Skeleton } from '@/components/ui';
import { useSession } from '@/store/session';
import { useTheme } from '@/theme/useTheme';

export default function AppLayout() {
  const status = useSession((s) => s.status);
  const { colors } = useTheme();

  if (status === 'loading') return <BootSplash />;
  if (status === 'unauthed') return <Redirect href="/(auth)/sign-in" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="group/[groupId]" />
      <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="create-group" options={{ presentation: 'modal' }} />
      <Stack.Screen name="join" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-buddy" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

/** Branded gate shown while we resolve the persisted auth session. */
function BootSplash() {
  return (
    <View className="flex-1 items-center justify-center bg-canvas">
      <Brandmark size="lg" />
      <View className="mt-8 w-40">
        <Skeleton height={6} radius={3} />
      </View>
    </View>
  );
}
