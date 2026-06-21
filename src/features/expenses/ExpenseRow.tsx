import { Feather } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { AmountText, Text } from '@/components/ui';
import { formatRelativeDate } from '@/lib/date';
import { formatMoneyAbs, sum } from '@/lib/money';
import type { Expense, GroupMember } from '@/lib/types';
import { useTheme } from '@/theme/useTheme';

import { useSession } from '@/store/session';
import { categoryIcon } from './categories';

export interface ExpenseRowProps {
	expense: Expense;
	currency: string;
	memberMap: Map<string, GroupMember>;
	currentUid: string;
	pending?: boolean;
	onPress?: () => void;
}

function firstName(member: GroupMember | undefined, fallback = 'Someone', currentUserId: string): string {
	return member?.id === currentUserId ? 'You' : (member?.displayName?.split(' ')[0] ?? fallback);
}

export const ExpenseRow = memo(function ExpenseRow({
	expense,
	currency,
	memberMap,
	currentUid,
	pending,
	onPress,
}: ExpenseRowProps) {
	const {colors} = useTheme();
	const uid = useSession((s) => s.uid) ?? '';

	const paid = sum(expense.paidBy.filter((p) => p.userId === currentUid).map((p) => p.amount));
	const owed = sum(expense.splits.filter((s) => s.userId === currentUid).map((s) => s.amount));
	const net = paid - owed; // + you lent / − you borrowed
	const payerNames = expense.paidBy.map((p) => firstName(memberMap.get(p.userId), 'unknown', uid)).join(', ');

	return (
		<Pressable onPress={onPress} className='flex-row items-center gap-3 py-3 active:opacity-70'>
			<View className='h-11 w-11 items-center justify-center rounded-2xl bg-sunken'>
				<Feather name={categoryIcon(expense.category)} size={18} color={colors.ink} />
			</View>
			<View className='flex-1'>
				<Text variant='label' numberOfLines={1}>
					{expense.description}
				</Text>
				<Text variant='caption' numberOfLines={1}>
					{payerNames} paid {formatMoneyAbs(expense.amount, currency)} · {formatRelativeDate(expense.createdAt)}
				</Text>
			</View>
			<View className='items-end'>
				{net === 0 ? <Text className='font-mono text-muted'>—</Text> : <AmountText minor={net} currency={currency} />}
				<Text variant='caption'>
					{pending ? 'sending…' : net > 0 ? 'you get back' : net < 0 ? 'you owe' : 'not involved'}
				</Text>
			</View>
		</Pressable>
	);
});
