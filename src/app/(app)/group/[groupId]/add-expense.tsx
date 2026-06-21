import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { Avatar, Button, Input, Screen, ScreenHeader, Segmented, Text } from '@/components/ui';
import { createExpense } from '@/features/expenses/service';
import { useContainerMembers, useGroup } from '@/features/groups/hooks';
import { cn } from '@/lib/cn';
import { allocateByWeights, formatMoneyAbs, parseAmountToMinor, splitEqual, sum } from '@/lib/money';
import type { SplitEntry, SplitMethod } from '@/lib/types';
import { useSession } from '@/store/session';
import { toast } from '@/store/ui';
import { useTheme } from '@/theme/useTheme';

export default function AddExpenseScreen() {
	const {groupId} = useLocalSearchParams<{groupId: string}>();
	const router = useRouter();
	const {colors} = useTheme();
	const uid = useSession((s) => s.uid) ?? '';

	const {data: group} = useGroup(groupId);
	const {data: members} = useContainerMembers(group);
	const currency = group?.currency ?? 'INR';

	const [description, setDescription] = useState('');
	const [amountText, setAmountText] = useState('');
	const [payer, setPayer] = useState(uid);
	const [participants, setParticipants] = useState<string[]>([]);
	const [method, setMethod] = useState<SplitMethod>('equal');
	const [exactText, setExactText] = useState<Record<string, string>>({});
	const [percentText, setPercentText] = useState<Record<string, string>>({});

	// Default: everyone participates, current user paid.
	useEffect(() => {
		if (members.length && participants.length === 0) {
			setParticipants(members.map((m) => m.id));
		}
	}, [members, participants.length]);

	const totalMinor = useMemo(() => parseAmountToMinor(amountText, currency) ?? 0, [amountText, currency]);

	const splits = useMemo<SplitEntry[]>(() => {
		if (participants.length === 0) return [];
		if (method === 'equal') {
			const parts = splitEqual(totalMinor, participants.length);
			return participants.map((id, i) => ({userId: id, amount: parts[i] ?? 0}));
		}
		if (method === 'percent') {
			const weights = participants.map((id) => Number(percentText[id] ?? '') || 0);
			if (sum(weights) <= 0) return participants.map((id) => ({userId: id, amount: 0}));
			const parts = allocateByWeights(totalMinor, weights);
			return participants.map((id, i) => ({userId: id, amount: parts[i] ?? 0}));
		}
		// exact
		return participants.map((id) => ({
			userId: id,
			amount: parseAmountToMinor(exactText[id] ?? '', currency) ?? 0,
		}));
	}, [method, participants, totalMinor, percentText, exactText, currency]);

	const splitSum = sum(splits.map((s) => s.amount));
	const percentSum = participants.reduce((acc, id) => acc + (Number(percentText[id] ?? '') || 0), 0);
	const remaining = totalMinor - splitSum;

	const methodValid = method === 'equal' ? true : method === 'percent' ? percentSum > 0 : splitSum === totalMinor;
	const canSave = description.trim().length > 0 && totalMinor > 0 && participants.length > 0 && methodValid;

	const toggleParticipant = (id: string) => {
		Haptics.selectionAsync().catch(() => {});
		setParticipants((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
	};

	const onSave = async () => {
		if (!canSave || !group) return;
		try {
			await createExpense({
				groupId,
				description: description.trim(),
				currency,
				amount: totalMinor,
				paidBy: [{userId: payer, amount: totalMinor}],
				splits,
				splitMethod: method,
				createdBy: uid,
			});
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
			toast.success('Expense added');
			router.back();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Could not add the expense.');
		}
	};

	return (
		<Screen>
			<ScreenHeader title='Add expense' onBack={() => router.back()} />
			<ScrollView
				contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 40, gap: 22}}
				keyboardShouldPersistTaps='handled'
			>
				{/* Amount hero */}
				<View className='items-center gap-1 py-2'>
					<Text variant='caption'>Amount ({currency})</Text>
					<TextInput
						value={amountText}
						onChangeText={setAmountText}
						placeholder='0'
						placeholderTextColor={colors.muted}
						keyboardType='decimal-pad'
						className='text-center font-display text-5xl text-ink '
						// style={{minWidth: 160}}
						autoFocus
					/>
				</View>

				<Input
					label='Description'
					value={description}
					onChangeText={setDescription}
					placeholder='Dinner, cab, groceries…'
				/>

				{/* Paid by */}
				<View className='gap-3'>
					<Text variant='label' className='text-muted'>
						Paid by
					</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 12}}>
						{members.map((m) => {
							const selected = payer === m.id;
							return (
								<Pressable key={m.id} onPress={() => setPayer(m.id)} className='items-center gap-1.5'>
									<View className={cn('rounded-full', selected && 'border-2 border-primary p-0.5')}>
										<Avatar name={m.displayName} uri={m.photoURL} size={48} />
									</View>
									<Text variant='caption' numberOfLines={1} className={cn(selected && 'text-primary')}>
										{m.id === uid ? 'You' : m.displayName.split(' ')[0]}
									</Text>
								</Pressable>
							);
						})}
					</ScrollView>
				</View>

				{/* Split method */}
				<View className='gap-3'>
					<Text variant='label' className='text-muted'>
						Split
					</Text>
					<Segmented
						value={method}
						onChange={setMethod}
						options={[
							{value: 'equal', label: 'Equally'},
							{value: 'exact', label: 'Exact'},
							{value: 'percent', label: 'Percent'},
						]}
					/>
				</View>

				{/* Participants + per-method controls */}
				<View className='gap-1'>
					{members.map((m) => {
						const participating = participants.includes(m.id);
						const share = splits.find((s) => s.userId === m.id)?.amount ?? 0;
						return (
							<View key={m.id} className='flex-row items-center gap-3 py-2'>
								<Pressable onPress={() => toggleParticipant(m.id)} className='flex-row items-center gap-3' hitSlop={8}>
									<Feather
										name={participating ? 'check-circle' : 'circle'}
										size={22}
										color={participating ? colors.primary : colors.muted}
									/>
									<Avatar name={m.displayName} uri={m.photoURL} size={36} />
								</Pressable>
								<Text variant='label' className='flex-1' numberOfLines={1}>
									{m.id === uid ? 'You' : m.displayName}
								</Text>

								{!participating ? null : method === 'equal' ? (
									<Text className='font-mono text-muted'>{formatMoneyAbs(share, currency)}</Text>
								) : method === 'exact' ? (
									<Input
										value={exactText[m.id] ?? ''}
										onChangeText={(t) => setExactText((p) => ({...p, [m.id]: t}))}
										placeholder='0'
										keyboardType='decimal-pad'
										className='py-2 text-right'
										containerClassName='w-28'
									/>
								) : (
									<View className='w-24 flex-row items-center gap-1'>
										<Input
											value={percentText[m.id] ?? ''}
											onChangeText={(t) => setPercentText((p) => ({...p, [m.id]: t}))}
											placeholder='0'
											keyboardType='decimal-pad'
											className='flex-1 py-2 text-right'
										/>
										<Text className='text-muted'>%</Text>
									</View>
								)}
							</View>
						);
					})}
				</View>

				{/* Validation summary */}
				<SplitSummary
					method={method}
					remaining={remaining}
					percentSum={percentSum}
					currency={currency}
					valid={methodValid && totalMinor > 0}
				/>

				<Button label='Add expense' size='lg' disabled={!canSave} onPress={onSave} />
			</ScrollView>
		</Screen>
	);
}

function SplitSummary({
	method,
	remaining,
	percentSum,
	currency,
	valid,
}: {
	method: SplitMethod;
	remaining: number;
	percentSum: number;
	currency: string;
	valid: boolean;
}) {
	if (method === 'equal') return null;

	let message: string;
	if (method === 'percent') {
		message = percentSum === 100 ? 'Percentages add up to 100%' : `${percentSum || 0}% assigned`;
	} else {
		message =
			remaining === 0
				? 'Splits add up exactly'
				: remaining > 0
					? `${formatMoneyAbs(remaining, currency)} left to assign`
					: `${formatMoneyAbs(-remaining, currency)} over the total`;
	}

	const ok = method === 'percent' ? percentSum > 0 : remaining === 0;
	return (
		<View className={cn('flex-row items-center gap-2 rounded-2xl px-4 py-3', ok ? 'bg-positive/10' : 'bg-negative/10')}>
			<Feather name={ok ? 'check' : 'alert-circle'} size={16} color={ok ? '#126B5B' : '#C0492C'} />
			<Text className={cn('font-sans-md text-sm', ok ? 'text-positive' : 'text-negative')}>{message}</Text>
		</View>
	);
}
