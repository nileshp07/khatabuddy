/**
 * Seed dummy data into the REAL Firestore via the Admin SDK (bypasses rules).
 *
 * Setup:
 *   1. Firebase console → Project settings → Service accounts → Generate new
 *      private key → save as ./serviceAccountKey.json (gitignored).
 *   2. npm i -D firebase-admin
 *   3. node scripts/seed.mjs
 *
 * Then sign in to the app as:  priya@demo.com / demo123456
 * (also arjun@demo.com, meera@demo.com — same password)
 */
import { readFileSync } from 'node:fs';

import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const auth = getAuth();
const now = () => Timestamp.now();

// Largest-remainder equal split → always sums back to total (paise).
function splitEqual(total, n) {
  const base = Math.floor(total / n);
  const rem = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

const PEOPLE = [
  { uid: 'seed_priya', name: 'Priya Sharma', email: 'priya@demo.com' },
  { uid: 'seed_arjun', name: 'Arjun Mehta', email: 'arjun@demo.com' },
  { uid: 'seed_meera', name: 'Meera Nair', email: 'meera@demo.com' },
];
const IDS = PEOPLE.map((p) => p.uid);
const GROUP_ID = 'seed_goa_trip';
const CODE = 'GOA123';
const CUR = 'INR';

async function ensureUser(p) {
  try {
    await auth.createUser({ uid: p.uid, email: p.email, password: 'demo123456', displayName: p.name });
    console.log('created auth user', p.email);
  } catch (e) {
    if (e.code === 'auth/uid-already-exists' || e.code === 'auth/email-already-exists') {
      console.log('auth user exists', p.email);
    } else throw e;
  }
  await db.doc(`users/${p.uid}`).set({
    id: p.uid,
    displayName: p.name,
    email: p.email,
    photoURL: null,
    defaultCurrency: CUR,
    pushTokens: [],
    createdAt: FieldValue.serverTimestamp(),
  });
}

// One balanced expense: paidBy[payer] = total, splits = equal over IDS.
function expense(id, description, category, payer, totalPaise) {
  const parts = splitEqual(totalPaise, IDS.length);
  return {
    ref: db.doc(`groups/${GROUP_ID}/expenses/${id}`),
    data: {
      id,
      groupId: GROUP_ID,
      description,
      category,
      amount: totalPaise,
      currency: CUR,
      paidBy: [{ userId: payer, amount: totalPaise }],
      splits: IDS.map((uid, i) => ({ userId: uid, amount: parts[i] })),
      splitMethod: 'equal',
      createdBy: payer,
      createdAt: now(),
      deletedAt: null,
    },
  };
}

async function main() {
  for (const p of PEOPLE) await ensureUser(p);

  await db.doc(`groups/${GROUP_ID}`).set({
    id: GROUP_ID,
    name: 'Goa Trip',
    type: 'trip',
    currency: CUR,
    photoURL: null,
    memberIds: IDS,
    inviteCode: CODE,
    budget: { total: 2000000, startDate: null, endDate: null }, // ₹20,000
    createdBy: IDS[0],
    createdAt: now(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.doc(`invites/${CODE}`).set({ id: CODE, groupId: GROUP_ID, createdBy: IDS[0], expiresAt: null });

  const roles = ['admin', 'member', 'member'];
  for (let i = 0; i < PEOPLE.length; i++) {
    await db.doc(`groups/${GROUP_ID}/members/${IDS[i]}`).set({
      id: IDS[i],
      displayName: PEOPLE[i].name,
      photoURL: null,
      role: roles[i],
      joinedAt: now(),
      settleStreak: 0,
    });
  }

  const expenses = [
    expense('exp_resort', 'Beach resort (2 nights)', 'stay', 'seed_priya', 900000),
    expense('exp_dinner', 'Seafood dinner', 'food', 'seed_arjun', 240000),
    expense('exp_scooter', 'Scooter rental', 'transport', 'seed_meera', 150000),
    expense('exp_cab', 'Airport cab', 'transport', 'seed_priya', 100000),
  ];
  for (const e of expenses) await e.ref.set(e.data);

  await db.doc(`groups/${GROUP_ID}/settlements/set_1`).set({
    id: 'set_1',
    groupId: GROUP_ID,
    fromUserId: 'seed_arjun',
    toUserId: 'seed_priya',
    amount: 50000, // ₹500
    currency: CUR,
    note: 'partial',
    createdBy: 'seed_arjun',
    createdAt: now(),
  });

  console.log('\n✅ Seeded. Sign in as priya@demo.com / demo123456 (also arjun@, meera@).');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
