import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';

import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View className="flex-row rounded-2xl bg-sunken p-1">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={cn('flex-1 items-center rounded-xl py-2.5', selected && 'bg-surface')}
          >
            <Text className={cn('font-sans-sb text-sm', selected ? 'text-ink' : 'text-muted')}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
