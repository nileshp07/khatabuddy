import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  AmountText,
  Avatar,
  Button,
  Card,
  EmptyState,
  Screen,
  Segmented,
  Skeleton,
  StatTile,
  Text,
} from '@/components/ui';
import { BuddyCard } from '@/features/buddies/BuddyCard';
import { GroupCard } from '@/features/groups/GroupCard';
import { useMyContainers } from '@/features/groups/hooks';
import { formatMoneyAbs } from '@/lib/money';
import type { Group } from '@/lib/types';
import { useSession } from '@/store/session';

type Tab = 'groups' | 'buddies';

export default function HomeScreen() {
	const router = useRouter();
	const profile = useSession((s) => s.profile);
	const uid = useSession((s) => s.uid) ?? '';
	const {data: containers, loading} = useMyContainers(uid);

	const [tab, setTab] = useState<Tab>('groups');
	const firstName = profile?.displayName?.split(' ')[0] ?? 'there';

	const groups = useMemo(() => containers.filter((c) => c.kind !== 'direct'), [containers]);
	const buddies = useMemo(() => containers.filter((c) => c.kind === 'direct'), [containers]);
	const list = tab === 'groups' ? groups : buddies;

	// Per-container net balances reported by each card, aggregated per active tab.
	const [nets, setNets] = useState<Record<string, {net: number; currency: string}>>({});
	const handleNet = useCallback((id: string, net: number, currency: string) => {
		setNets((prev) =>
			prev[id]?.net === net && prev[id]?.currency === currency ? prev : {...prev, [id]: {net, currency}},
		);
	}, []);

	const summary = useMemo(() => {
		const ids = new Set(list.map((c) => c.id));
		const byCurrency: Record<string, {owed: number; owe: number}> = {};
		let toSettle = 0;
		for (const [id, {net, currency}] of Object.entries(nets)) {
			if (!ids.has(id)) continue;
			byCurrency[currency] ??= {owed: 0, owe: 0};
			if (net > 0) byCurrency[currency].owed += net;
			else if (net < 0) byCurrency[currency].owe += -net;
			if (net !== 0) toSettle += 1;
		}
		const currencies = Object.keys(byCurrency);
		const primary =
			profile?.defaultCurrency && byCurrency[profile.defaultCurrency] ? profile.defaultCurrency : currencies[0];
		const totals = primary ? byCurrency[primary] : {owed: 0, owe: 0};
		return {
			primary: primary ?? profile?.defaultCurrency ?? 'INR',
			owed: totals.owed,
			owe: totals.owe,
			net: totals.owed - totals.owe,
			toSettle,
			otherCurrencies: currencies.filter((c) => c !== primary).length,
		};
	}, [nets, list, profile?.defaultCurrency]);

	return (
		<Screen>
			{/* Header */}
			<View className='flex-row items-center justify-between px-5 pb-2 mt-4'>
				<View>
					{/* <Text variant='caption'>Welcome back</Text> */}
					<Text variant='title'>Hello, {firstName}</Text>
				</View>
				<Pressable onPress={() => router.push('/profile')} accessibilityLabel='Open profile'>
					<Avatar name={profile?.displayName ?? 'You'} uri={profile?.photoURL} size={44} />
				</Pressable>
			</View>

			{/* Tabs */}
			<View className='px-5 pb-3'>
				<Segmented
					value={tab}
					onChange={setTab}
					options={[
						{value: 'groups', label: 'Groups'},
						{value: 'buddies', label: 'Buddies'},
					]}
				/>
			</View>

			{/* Quick actions */}
			<View className='flex-row gap-3 px-5 pb-3'>
				{tab === 'groups' ? (
					<>
						<Button
							label='New group'
							leftIconName='plus'
							className='flex-1'
							onPress={() => router.push('/create-group')}
						/>
						<Button label='Join' variant='surface' onPress={() => router.push('/join')} />
					</>
				) : (
					<Button
						label='Add buddy'
						leftIconName='user-plus'
						className='flex-1'
						onPress={() => router.push('/add-buddy')}
					/>
				)}
			</View>

			{loading && containers.length === 0 ? (
				<View className='gap-3 px-5 pt-2'>
					<Skeleton height={132} radius={24} />
					{[0, 1, 2].map((i) => (
						<Card key={i} className='flex-row items-center gap-4'>
							<Skeleton width={48} height={48} radius={16} />
							<View className='flex-1 gap-2'>
								<Skeleton width='60%' height={16} />
								<Skeleton width='40%' height={12} />
							</View>
						</Card>
					))}
				</View>
			) : (
				<FlashList<Group>
					data={list}
					extraData={tab}
					keyExtractor={(g) => g.id}
					contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 32}}
					ItemSeparatorComponent={() => <View className='h-3' />}
					ListHeaderComponent={list.length > 0 ? <OverallSummary {...summary} /> : null}
					ListEmptyComponent={
						tab === 'groups' ? (
							<EmptyState
								icon='users'
								title='No groups yet'
								subtitle='Start a trip, a flat, or an event and invite your people to split costs fairly.'
								action={<Button label='Create your first group' onPress={() => router.push('/create-group')} />}
							/>
						) : (
							<EmptyState
								icon='user-plus'
								title='No buddies yet'
								subtitle='Add someone to track shared costs one-on-one — separate from any group.'
								action={<Button label='Add a buddy' onPress={() => router.push('/add-buddy')} />}
							/>
						)
					}
					renderItem={({item}) =>
						tab === 'groups' ? (
							<GroupCard
								group={item}
								currentUid={uid}
								onNet={handleNet}
								onPress={() => router.push(`/group/${item.id}`)}
							/>
						) : (
							<BuddyCard
								group={item}
								currentUid={uid}
								onNet={handleNet}
								onPress={() => router.push(`/group/${item.id}`)}
							/>
						)
					}
				/>
			)}
		</Screen>
	);
}

function OverallSummary({
	primary,
	owed,
	owe,
	net,
	toSettle,
	otherCurrencies,
}: {
	primary: string;
	owed: number;
	owe: number;
	net: number;
	toSettle: number;
	otherCurrencies: number;
}) {
	return (
		<View className='gap-3 pb-4'>
			<Card className='gap-1'>
				<Text variant='caption'>Your overall balance</Text>
				{net === 0 ? (
					<Text variant='title' className='text-primary'>
						All settled 🎉
					</Text>
				) : (
					<AmountText minor={net} currency={primary} className='text-3xl' />
				)}
				<Text variant='caption'>
					{toSettle} to settle{otherCurrencies > 0 ? ` · +${otherCurrencies} other currency` : ''}
				</Text>
			</Card>
			<View className='flex-row gap-3'>
				<StatTile label='Owed to you' value={formatMoneyAbs(owed, primary)} tone='positive' />
				<StatTile label='You owe' value={formatMoneyAbs(owe, primary)} tone='negative' />
			</View>
		</View>
	);
}
