import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { ControlledInput } from '@/components/form/ControlledInput';
import { Button, Text } from '@/components/ui';
import { AuthShell } from '@/features/auth/AuthShell';
import { authErrorMessage, signIn } from '@/features/auth/service';
import { signInSchema, type SignInValues } from '@/validation/schemas';
import { toast } from '@/store/ui';

export default function SignInScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn(values.email, values.password);
      // The auth listener + (auth) guard handle navigation away.
    } catch (error) {
      toast.error(authErrorMessage(error));
    }
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Settle up with your people — trips, flatmates, and everything in between."
      footer={
        <View className="flex-row justify-center gap-1">
          <Text className="text-muted">New here?</Text>
          <Link href="/(auth)/sign-up">
            <Text className="font-sans-sb text-primary">Create an account</Text>
          </Link>
        </View>
      }
    >
      <View className="gap-4">
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
          placeholder="••••••••"
          secureTextEntry
          autoComplete="current-password"
          error={errors.password?.message}
        />
        <Button label="Sign in" size="lg" loading={isSubmitting} onPress={onSubmit} className="mt-2" />
      </View>
    </AuthShell>
  );
}
