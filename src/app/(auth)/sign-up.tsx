import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { ControlledInput } from '@/components/form/ControlledInput';
import { Button, Text } from '@/components/ui';
import { AuthShell } from '@/features/auth/AuthShell';
import { authErrorMessage, signUp } from '@/features/auth/service';
import { signUpSchema, type SignUpValues } from '@/validation/schemas';
import { toast } from '@/store/ui';

export default function SignUpScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signUp(values.name, values.email, values.password);
    } catch (error) {
      toast.error(authErrorMessage(error));
    }
  });

  return (
    <AuthShell
      title="Create account"
      subtitle="Start a shared ledger in seconds. Fair splits, friendly reminders, zero spreadsheets."
      footer={
        <View className="flex-row justify-center gap-1">
          <Text className="text-muted">Already have an account?</Text>
          <Link href="/(auth)/sign-in">
            <Text className="font-sans-sb text-primary">Sign in</Text>
          </Link>
        </View>
      }
    >
      <View className="gap-4">
        <ControlledInput
          control={control}
          name="name"
          label="Your name"
          placeholder="Priya Sharma"
          autoCapitalize="words"
          error={errors.name?.message}
        />
        <ControlledInput
          control={control}
          name="email"
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          error={errors.email?.message}
        />
        <ControlledInput
          control={control}
          name="password"
          label="Password"
          placeholder="At least 6 characters"
          secureTextEntry
          autoComplete="new-password"
          error={errors.password?.message}
        />
        <Button label="Create account" size="lg" loading={isSubmitting} onPress={onSubmit} className="mt-2" />
      </View>
    </AuthShell>
  );
}
