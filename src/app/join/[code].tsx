import { Feather } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Brandmark } from '@/components/Brandmark';
import { Button, Screen, Skeleton, Text } from '@/components/ui';
import { joinGroupByCode } from '@/features/groups/service';
import { useSession } from '@/store/session';
import { toast } from '@/store/ui';
import { useTheme } from '@/theme/useTheme';

/** Deep-link handler for invite links: khatabuddy://join/ABC123 */
export default function JoinByLinkScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const status = useSession((s) => s.status);
  const uid = useSession((s) => s.uid);
  const profile = useSession((s) => s.profile);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authed' || !uid || !profile || !code) return;
    let active = true;
    (async () => {
      try {
        const groupId = await joinGroupByCode(
          { id: uid, displayName: profile.displayName, photoURL: profile.photoURL },
          String(code).toUpperCase(),
        );
        if (!active) return;
        toast.success('You joined the group!');
        router.replace(`/group/${groupId}`);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not join that group.');
      }
    })();
    return () => {
      active = false;
    };
  }, [status, uid, profile, code, router]);

  return (
    <Screen padded>
      <View className="flex-1 items-center justify-center gap-6">
        <Brandmark size="lg" showWordmark={false} />

        {status === 'unauthed' ? (
          <View className="items-center gap-4">
            <Text variant="title" className="text-center">
              Sign in to join
            </Text>
            <Text variant="body" className="text-center text-muted">
              You&apos;ve been invited to a group. Sign in or create an account to continue.
            </Text>
            <Link href="/(auth)/sign-in" asChild>
              <Button label="Continue" />
            </Link>
          </View>
        ) : error ? (
          <View className="items-center gap-4">
            <Feather name="alert-triangle" size={32} color={colors.negative} />
            <Text variant="title" className="text-center">
              Couldn&apos;t join
            </Text>
            <Text variant="body" className="text-center text-muted">
              {error}
            </Text>
            <Button label="Back to groups" variant="surface" onPress={() => router.replace('/')} />
          </View>
        ) : (
          <View className="items-center gap-4">
            <Text variant="title">Joining group…</Text>
            <View className="w-40">
              <Skeleton height={6} radius={3} />
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
