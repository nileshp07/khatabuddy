import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, View } from 'react-native';

import { ControlledInput } from '@/components/form/ControlledInput';
import { Button, Chip, Screen, ScreenHeader, Text } from '@/components/ui';
import { createGroup } from '@/features/groups/service';
import { CURRENCIES, GROUP_TYPES, GROUP_TYPE_META } from '@/features/groups/meta';
import { useSession } from '@/store/session';
import { toast } from '@/store/ui';
import { useTheme } from '@/theme/useTheme';
import { createGroupSchema, type CreateGroupValues } from '@/validation/schemas';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const uid = useSession((s) => s.uid);
  const profile = useSession((s) => s.profile);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: '', type: 'trip', currency: profile?.defaultCurrency ?? 'INR' },
  });

  const type = watch('type');
  const currency = watch('currency');

  const onSubmit = handleSubmit(async (values) => {
    if (!uid || !profile) return;
    try {
      const groupId = await createGroup(
        { id: uid, displayName: profile.displayName, photoURL: profile.photoURL },
        { name: values.name.trim(), type: values.type, currency: values.currency },
      );
      toast.success('Group created');
      router.replace(`/group/${groupId}`);
    } catch {
      toast.error('Could not create the group. Try again.');
    }
  });

  return (
    <Screen>
      <ScreenHeader title="New group" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <ControlledInput
          control={control}
          name="name"
          label="Group name"
          placeholder="Goa trip, Flat 4B, Diwali party…"
          autoFocus
          error={errors.name?.message}
        />

        {/* Type selector */}
        <View className="gap-3">
          <Text variant="label" className="text-muted">
            What kind of group?
          </Text>
          <View className="gap-3">
            {GROUP_TYPES.map((t) => {
              const meta = GROUP_TYPE_META[t];
              const selected = type === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setValue('type', t, { shouldValidate: true })}
                  className={`flex-row items-center gap-3 rounded-2xl border p-4 active:scale-[0.99] ${
                    selected ? 'border-primary bg-primary/10' : 'border-line bg-surface'
                  }`}
                >
                  <View
                    className={`h-11 w-11 items-center justify-center rounded-2xl ${selected ? 'bg-primary' : 'bg-sunken'}`}
                  >
                    <Feather name={meta.icon} size={20} color={selected ? colors.primaryInk : colors.accent} />
                  </View>
                  <View className="flex-1">
                    <Text variant="heading">{meta.label}</Text>
                    <Text variant="caption">{meta.blurb}</Text>
                  </View>
                  {selected ? <Feather name="check-circle" size={20} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Currency selector */}
        <View className="gap-3">
          <Text variant="label" className="text-muted">
            Currency
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Controller
              control={control}
              name="currency"
              render={() => (
                <>
                  {CURRENCIES.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={currency === c}
                      onPress={() => setValue('currency', c, { shouldValidate: true })}
                    />
                  ))}
                </>
              )}
            />
          </View>
        </View>

        <Button label="Create group" size="lg" loading={isSubmitting} onPress={onSubmit} />
      </ScrollView>
    </Screen>
  );
}
