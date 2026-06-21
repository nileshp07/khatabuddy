import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

export interface ScreenProps {
  children: ReactNode;
  className?: string;
  /** Apply the top safe-area inset as padding (default true). */
  topInset?: boolean;
  /** Add comfortable horizontal padding (default false). */
  padded?: boolean;
}

export function Screen({ children, className, topInset = true, padded = false }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={cn('flex-1 bg-canvas', padded && 'px-5', className)}
      style={{ paddingTop: topInset ? insets.top : 0 }}
    >
      {children}
    </View>
  );
}
