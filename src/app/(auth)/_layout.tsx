import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/store/session';
import { useTheme } from '@/theme/useTheme';

export default function AuthLayout() {
  const status = useSession((s) => s.status);
  const { colors } = useTheme();

  // Already signed in → bounce to the app.
  if (status === 'authed') return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.canvas },
      }}
    />
  );
}
