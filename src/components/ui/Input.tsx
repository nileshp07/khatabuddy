import { forwardRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/useTheme';

import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className, containerClassName, ...rest },
  ref,
) {
  const { colors } = useTheme();
  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label ? (
        <Text variant="label" className="text-muted">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        className={cn(
          'rounded-2xl border bg-surface px-4 py-3.5 font-sans text-base text-ink',
          error ? 'border-negative' : 'border-line',
          className,
        )}
        {...rest}
      />
      {error ? (
        <Text variant="caption" className="text-negative">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
