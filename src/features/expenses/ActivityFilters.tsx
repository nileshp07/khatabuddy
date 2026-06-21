import { Pressable, ScrollView, View } from 'react-native';

import { Avatar, Chip, Segmented, Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { GroupMember } from '@/lib/types';

export type DateRange = 'all' | '7d' | '30d';

export interface ActivityFiltersProps {
  members: GroupMember[];
  currentUid: string;
  payer: string | null;
  range: DateRange;
  onPayer: (uid: string | null) => void;
  onRange: (range: DateRange) => void;
}

/** Filter the activity feed by date window and by who paid. */
export function ActivityFilters({
  members,
  currentUid,
  payer,
  range,
  onPayer,
  onRange,
}: ActivityFiltersProps) {
  return (
    <View className="gap-3">
      <Segmented
        value={range}
        onChange={onRange}
        options={[
          { value: 'all', label: 'All time' },
          { value: '30d', label: '30 days' },
          { value: '7d', label: '7 days' },
        ]}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        <View className="justify-center">
          <Chip label="Everyone" selected={payer === null} onPress={() => onPayer(null)} />
        </View>
        {members.map((m) => {
          const selected = payer === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => onPayer(m.id)}
              className="items-center gap-1"
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <View className={cn('rounded-full', selected && 'border-2 border-primary p-0.5')}>
                <Avatar name={m.displayName} uri={m.photoURL} size={40} />
              </View>
              <Text variant="caption" numberOfLines={1} className={cn(selected && 'text-primary')}>
                {m.id === currentUid ? 'You' : m.displayName.split(' ')[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
