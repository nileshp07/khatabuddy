import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Avatar, Button, Card, Screen, ScreenHeader, Text } from '@/components/ui';
import { signOut } from '@/features/auth/service';
import { cn } from '@/lib/cn';
import { useSession } from '@/store/session';
import { useThemeStore, type ThemePref } from '@/store/ui';
import { useTheme } from '@/theme/useTheme';

const THEME_OPTIONS: {value: ThemePref; label: string; icon: 'sun' | 'moon' | 'smartphone'}[] = [
	{value: 'light', label: 'Light', icon: 'sun'},
	{value: 'dark', label: 'Dark', icon: 'moon'},
	{value: 'system', label: 'System', icon: 'smartphone'},
];

export default function ProfileScreen() {
	const router = useRouter();
	const {colors} = useTheme();
	const profile = useSession((s) => s.profile);
	const pref = useThemeStore((s) => s.pref);
	const setPref = useThemeStore((s) => s.setPref);

	return (
		<Screen>
			<ScreenHeader title='Profile' onBack={() => router.back()} />
			<View className='gap-6 px-5 pt-2'>
				{/* Identity */}
				<Card className='flex-row items-center gap-4'>
					<Avatar name={profile?.displayName ?? 'You'} uri={profile?.photoURL} size={56} />
					<View className='flex-1'>
						<Text variant='heading' numberOfLines={1}>
							{profile?.displayName ?? 'You'}
						</Text>
						<Text variant='caption' numberOfLines={1}>
							{profile?.email}
						</Text>
					</View>
				</Card>

				{/* Add a buddy */}
				<Pressable onPress={() => router.push('/add-buddy')} className='active:scale-[0.99]'>
					<Card className='flex-row items-center gap-3'>
						<View className='h-10 w-10 items-center justify-center rounded-2xl bg-sunken'>
							<Feather name='user-plus' size={20} color={colors.accent} />
						</View>
						<View className='flex-1'>
							<Text variant='heading'>Add a buddy</Text>
							<Text variant='caption'>Track shared costs one-on-one</Text>
						</View>
						<Feather name='chevron-right' size={20} color={colors.muted} />
					</Card>
				</Pressable>

				{/* Appearance */}
				<View className='gap-3'>
					<Text variant='label' className='text-muted'>
						Appearance
					</Text>
					<View className='flex-row gap-2'>
						{THEME_OPTIONS.map((opt) => {
							const selected = pref === opt.value;
							return (
								<Pressable
									key={opt.value}
									onPress={() => setPref(opt.value)}
									className={cn(
										'flex-1 items-center gap-2 rounded-2xl border p-4 active:scale-[0.98]',
										selected ? 'border-primary bg-primary/10' : 'border-line bg-surface',
									)}
								>
									<Feather name={opt.icon} size={20} color={selected ? colors.primary : colors.muted} />
									<Text className={cn('font-sans-sb text-sm', selected ? 'text-primary' : 'text-ink')}>
										{opt.label}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</View>

				<View className='flex-1' />
				<Button label='Sign out' variant='surface' leftIconName='log-out' onPress={() => signOut()} />
			</View>
		</Screen>
	);
}
