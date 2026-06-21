import { useColorScheme } from 'nativewind';
import { useEffect, type ReactNode } from 'react';

import { useThemeStore } from '@/store/ui';

/**
 * Pushes the persisted theme preference into NativeWind whenever it changes,
 * so a manual light/dark/system choice survives restarts.
 */
export function ThemeController({ children }: { children: ReactNode }) {
  const pref = useThemeStore((s) => s.pref);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(pref);
  }, [pref, setColorScheme]);

  return <>{children}</>;
}
