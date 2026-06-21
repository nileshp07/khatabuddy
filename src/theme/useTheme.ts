import { useColorScheme } from 'nativewind';

import { palette, type Palette, type Scheme } from './colors';

/**
 * Resolved theme for non-className consumers. `scheme` is the *effective*
 * light/dark value (NativeWind has already resolved "system").
 */
export function useTheme(): { scheme: Scheme; colors: Palette } {
  const { colorScheme } = useColorScheme();
  const scheme: Scheme = colorScheme === 'dark' ? 'dark' : 'light';
  return { scheme, colors: palette[scheme] };
}
