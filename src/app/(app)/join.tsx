import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { ControlledInput } from '@/components/form/ControlledInput';
import { Button, Screen, ScreenHeader, Text } from '@/components/ui';
import { joinGroupByCode } from '@/features/groups/service';
import { useSession } from '@/store/session';
import { toast } from '@/store/ui';
import { joinGroupSchema, type JoinGroupValues } from '@/validation/schemas';

export default function JoinGroupScreen() {
  const router = useRouter();
  const uid = useSession((s) => s.uid);
  const profile = useSession((s) => s.profile);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinGroupValues>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = handleSubmit(async ({ code }) => {
    if (!uid || !profile) return;
    try {
      const groupId = await joinGroupByCode(
        { id: uid, displayName: profile.displayName, photoURL: profile.photoURL },
        code,
      );
      toast.success('You joined the group!');
      router.replace(`/group/${groupId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not join that group.');
    }
  });

  return (
    <Screen>
      <ScreenHeader title="Join a group" onBack={() => router.back()} />
      <View className="gap-5 px-5 pt-2">
        <Text variant="body" className="text-muted">
          Ask a group member for their 6-character invite code, or open their invite link.
        </Text>
        <ControlledInput
          control={control}
          name="code"
          label="Invite code"
          placeholder="ABC123"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          autoFocus
          error={errors.code?.message}
        />
        <Button label="Join group" size="lg" loading={isSubmitting} onPress={onSubmit} />
      </View>
    </Screen>
  );
}
