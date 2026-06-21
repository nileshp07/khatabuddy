import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, EmptyState, IconButton, Screen, ScreenHeader, Skeleton, Text } from '@/components/ui';
import { BalanceHero } from '@/features/balances/BalanceHero';
import { GroupStats } from '@/features/balances/GroupStats';
import { SettleSuggestions } from '@/features/balances/SettleSuggestions';
import { netBalanceFor } from '@/features/balances/engine';
import { useLedger } from '@/features/balances/hooks';
import { ActivityFilters, type DateRange } from '@/features/expenses/ActivityFilters';
import { ExpenseRow } from '@/features/expenses/ExpenseRow';
import { otherParticipant, useContainerMembers, useGroup, useMemberMap } from '@/features/groups/hooks';
import { GROUP_TYPE_META } from '@/features/groups/meta';
import { SettlementRow } from '@/features/settlements/SettlementRow';
import type { Expense, Settlement } from '@/lib/types';
import { useSession } from '@/store/session';

type ActivityItem =
	| {kind: 'expense'; data: Expense; createdAt: number}
	| {kind: 'settlement'; data: Settlement; createdAt: number};

export default function GroupDetailScreen() {
	const {groupId} = useLocalSearchParams<{groupId: string}>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const uid = useSession((s) => s.uid) ?? '';

	const {data: group, loading: groupLoading} = useGroup(groupId);
	const {data: members} = useContainerMembers(group);
	const memberMap = useMemberMap(members);
	const {expenses, settlements, balances, transfers, loading} = useLedger(groupId);

	const currency = group?.currency ?? 'INR';
	const net = netBalanceFor(balances, uid);

	const isDirect = group?.kind === 'direct';
	const buddy = group ? otherParticipant(group, uid) : null;
	const title = isDirect ? (buddy?.displayName ?? 'Buddy') : (group?.name ?? 'Group');
	const subtitle = isDirect ? 'buddy' : group ? GROUP_TYPE_META[group.type].label : undefined;

	// Filters
	const [payerFilter, setPayerFilter] = useState<string | null>(null);
	const [range, setRange] = useState<DateRange>('all');

	const activity = useMemo<ActivityItem[]>(() => {
		const items: ActivityItem[] = [];
		for (const e of expenses) {
			if (!e.deletedAt) items.push({kind: 'expense', data: e, createdAt: e.createdAt ?? 0});
		}
		for (const s of settlements) {
			items.push({kind: 'settlement', data: s, createdAt: s.createdAt ?? 0});
		}
		items.sort((a, b) => b.createdAt - a.createdAt);
		return items;
	}, [expenses, settlements]);

	const filtered = useMemo(() => {
		const cutoff = range === '7d' ? Date.now() - 7 * 86_400_000 : range === '30d' ? Date.now() - 30 * 86_400_000 : 0;
		return activity.filter((it) => {
			if (it.createdAt < cutoff) return false;
			if (payerFilter) {
				return it.kind === 'expense'
					? it.data.paidBy.some((p) => p.userId === payerFilter)
					: it.data.fromUserId === payerFilter;
			}
			return true;
		});
	}, [activity, range, payerFilter]);

	const goSettle = (toUserId: string, amount: number) =>
		router.push({
			pathname: '/group/[groupId]/settle',
			params: {groupId, to: toUserId, amount: String(amount)},
		});

	return (
		<Screen>
			<ScreenHeader
				title={title}
				subtitle={subtitle}
				onBack={() => router.back()}
				right={
					isDirect ? undefined : (
						<IconButton
							icon='users'
							accessibilityLabel='Members & invite'
							onPress={() => router.push(`/group/${groupId}/members`)}
						/>
					)
				}
			/>

			<FlashList<ActivityItem>
				data={filtered}
				keyExtractor={(item) => `${item.kind}:${item.data.id}`}
				contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 140}}
				ListHeaderComponent={
					<View className='gap-5 pb-2 pt-1'>
						{groupLoading && !group ? (
							<Skeleton height={120} radius={24} />
						) : (
							<BalanceHero net={net} currency={currency} />
						)}
						<SettleSuggestions
							transfers={transfers}
							currentUid={uid}
							currency={currency}
							memberMap={memberMap}
							onSettle={goSettle}
						/>
						<GroupStats expenses={expenses} currency={currency} currentUid={uid} />
						{activity.length > 0 ? (
							<View className='gap-4'>
								<View className='h-px bg-line' />
								<ActivityFilters
									members={members}
									currentUid={uid}
									payer={payerFilter}
									range={range}
									onPayer={setPayerFilter}
									onRange={setRange}
								/>
								<Text variant='label' className='text-muted'>
									Activity ({filtered.length})
								</Text>
							</View>
						) : null}
					</View>
				}
				ItemSeparatorComponent={() => <View className='h-px bg-line' />}
				renderItem={({item}) =>
					item.kind === 'expense' ? (
						<ExpenseRow
							expense={item.data}
							currency={currency}
							memberMap={memberMap}
							currentUid={uid}
							onPress={() =>
								router.push({
									pathname: '/group/[groupId]/expense/[expenseId]',
									params: {groupId, expenseId: item.data.id},
								})
							}
						/>
					) : (
						<SettlementRow settlement={item.data} currency={currency} memberMap={memberMap} currentUid={uid} />
					)
				}
				ListEmptyComponent={
					loading ? (
						<View className='gap-4 pt-4'>
							{[0, 1, 2].map((i) => (
								<View key={i} className='flex-row items-center gap-3'>
									<Skeleton width={44} height={44} radius={16} />
									<View className='flex-1 gap-2'>
										<Skeleton width='55%' height={14} />
										<Skeleton width='35%' height={10} />
									</View>
								</View>
							))}
						</View>
					) : activity.length === 0 ? (
						<EmptyState
							icon='file-plus'
							title='No expenses yet'
							subtitle='Add your first shared cost and KhataBuddy will keep everyone’s balances fair and tidy.'
						/>
					) : (
						<View className='items-center gap-1 py-10'>
							<Text variant='heading'>No matching activity</Text>
							<Text variant='caption'>Try a wider date range or a different payer.</Text>
						</View>
					)
				}
			/>

			{/* Sticky action bar */}
			<View
				className='absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-line bg-canvas px-5 pt-3'
				style={{paddingBottom: insets.bottom + 12}}
			>
				<Button
					label='Add expense'
					leftIconName='plus'
					className='flex-1'
					onPress={() => router.push(`/group/${groupId}/add-expense`)}
				/>
				<Button label='Settle up' variant='surface' onPress={() => router.push(`/group/${groupId}/settle`)} />
			</View>
		</Screen>
	);
}
