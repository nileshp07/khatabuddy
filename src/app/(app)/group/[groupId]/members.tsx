import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Share, View } from 'react-native';

import { Avatar, Badge, Button, Card, Screen, ScreenHeader, Skeleton, Text } from '@/components/ui';
import { useGroup, useGroupMembers } from '@/features/groups/hooks';
import { toast } from '@/store/ui';

export default function MembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { data: group } = useGroup(groupId);
  const { data: members, loading } = useGroupMembers(groupId);

  const code = group?.inviteCode ?? '';

  const onShare = async () => {
    if (!group) return;
    try {
      const url = Linking.createURL(`join/${code}`);
      await Share.share({
        message: `Join "${group.name}" on KhataBuddy 💸\nTap to join: ${url}\nOr enter code: ${code}`,
      });
    } catch {
      toast.error('Could not open the share sheet.');
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Members" onBack={() => router.back()} />
      <View className="gap-6 px-5 pt-2">
        {/* Invite card */}
        <Card className="gap-4">
          <View>
            <Text variant="caption">Invite code</Text>
            <Text className="mt-1 font-mono-sb text-3xl tracking-[8px] text-ink">{code || '······'}</Text>
          </View>
          <Text variant="caption">
            Share this code or the invite link. Anyone with it can join and start splitting.
          </Text>
          <Button label="Share invite" leftIconName="share-2" onPress={onShare} />
        </Card>

        {/* Members list */}
        <View className="gap-3">
          <Text variant="label" className="text-muted">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Text>
          {loading && members.length === 0
            ? [0, 1].map((i) => <Skeleton key={i} height={56} radius={16} />)
            : members.map((m) => (
                <View key={m.id} className="flex-row items-center gap-3 py-1">
                  <Avatar name={m.displayName} uri={m.photoURL} size={42} />
                  <Text variant="heading" className="flex-1">
                    {m.displayName}
                  </Text>
                  {m.role === 'admin' ? <Badge label="Admin" tone="accent" /> : null}
                </View>
              ))}
        </View>
      </View>
    </Screen>
  );
}
