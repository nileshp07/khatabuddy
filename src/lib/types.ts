/**
 * Domain models for KhataBuddy.
 *
 * All monetary values are integers in the currency's **minor unit**
 * (paise / cents). Timestamps are epoch milliseconds at this layer — the
 * Firestore converters (see lib/firebase/converters.ts) translate Firestore
 * `Timestamp`s to/from `number` so the rest of the app never touches the SDK
 * timestamp type.
 */

export type GroupType = 'trip' | 'home' | 'event';
export type SplitMethod = 'equal' | 'exact' | 'percent';
export type MemberRole = 'admin' | 'member';

/** A single payer line — supports multiple people fronting one expense. */
export interface PaidByEntry {
	userId: string;
	amount: number; // minor units
}

/** A single consumer line — how much of an expense a member is responsible for. */
export interface SplitEntry {
	userId: string;
	amount: number; // minor units
}

export interface Expense {
	id: string;
	groupId: string;
	description: string;
	category?: string;
	amount: number; // minor units; invariant: == sum(splits) == sum(paidBy)
	currency: string;
	fxRate?: number; // rate -> group currency captured at entry time (multi-currency)
	paidBy: PaidByEntry[];
	splits: SplitEntry[];
	splitMethod: SplitMethod;
	createdBy: string;
	createdAt: number; // epoch ms
	updatedAt?: number;
	deletedAt?: number | null; // soft delete keeps the ledger intact
}

export interface Settlement {
	id: string;
	groupId: string;
	fromUserId: string; // payer
	toUserId: string; // payee
	amount: number; // minor units
	currency: string;
	note?: string;
	createdBy: string;
	createdAt: number;
}

export interface GroupBudget {
	total: number; // minor units
	startDate?: number;
	endDate?: number;
}

/** Display info denormalized onto a direct (buddy) container — used in place of
 *  the members subcollection for 1:1 pairs. */
export interface ParticipantInfo {
	displayName: string;
	photoURL?: string | null;
}

export interface Group {
	id: string;
	name: string;
	type: GroupType;
	currency: string;
	photoURL?: string | null;
	memberIds: string[]; // denormalized for rules + "my groups" query
	inviteCode: string;
	budget?: GroupBudget | null; // trip groups (Phase 3)
	createdBy: string;
	createdAt: number;
	updatedAt?: number;
	/** 'group' (default/absent) = normal group; 'direct' = private 1:1 buddy pair. */
	kind?: 'group' | 'direct';
	/** For direct containers: both people's display info, keyed by uid (no members subcollection). */
	participants?: Record<string, ParticipantInfo>;
}

export interface GroupMember {
	id: string; // == uid
	displayName: string; // denormalized snapshot
	photoURL?: string | null;
	role: MemberRole;
	joinedAt: number;
	settleStreak?: number; // gamification (Phase 5)
}

export interface UserProfile {
	id: string; // == uid
	displayName: string;
	email: string;
	photoURL?: string | null;
	defaultCurrency: string;
	pushTokens?: string[];
	createdAt: number;
}

export interface Invite {
	id: string; // == the invite code (the document key)
	groupId: string;
	createdBy: string;
	expiresAt?: number | null;
}

/** A single proposed payment produced by debt simplification. */
export interface Transfer {
	from: string;
	to: string;
	amount: number; // minor units
}
