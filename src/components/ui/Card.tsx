import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

export interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, ...rest }: CardProps) {
  return <View className={cn('rounded-2xl border border-line bg-surface p-4', className)} {...rest} />;
}
