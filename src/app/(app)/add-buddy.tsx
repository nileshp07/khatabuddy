import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { ControlledInput } from '@/components/form/ControlledInput';
import { Button, Screen, ScreenHeader, Text } from '@/components/ui';
import { addBuddy } from '@/features/buddies/service';
import { useSession } from '@/store/session';
import { toast } from '@/store/ui';
import { addBuddySchema, type AddBuddyValues } from '@/validation/schemas';

export default function AddBuddyScreen() {
  const router = useRouter();
  const uid = useSession((s) => s.uid);
  const profile = useSession((s) => s.profile);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddBuddyValues>({
    resolver: zodResolver(addBuddySchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    if (!uid || !profile) return;
    try {
      const pairId = await addBuddy(
        {
          id: uid,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          defaultCurrency: profile.defaultCurrency,
        },
        email,
      );
      toast.success('Buddy added');
      router.replace(`/group/${pairId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add that buddy.');
    }
  });

  return (
    <Screen>
      <ScreenHeader title="Add a buddy" onBack={() => router.back()} />
      <View className="gap-5 px-5 pt-2">
        <Text variant="body" className="text-muted">
          Track shared costs one-on-one. Enter your buddy’s email — they need a KhataBuddy
          account. This ledger stays private between the two of you.
        </Text>
        <ControlledInput
          control={control}
          name="email"
          label="Buddy’s email"
          placeholder="buddy@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          autoFocus
          error={errors.email?.message}
        />
        <Button label="Add buddy" size="lg" loading={isSubmitting} onPress={onSubmit} />
      </View>
    </Screen>
  );
}
