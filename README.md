# KhataBuddy

A Splitwise-style expense splitter for React Native, differentiated for **trips**,
**flatmates (recurring)**, and **events** — with a strong design layer and an
architecture built around an **append-only ledger** and **derived balances**.

> *Khata* (खाता) is the Hindi word for a ledger. The whole app is themed as a warm,
> tactile ledger — marigold, ink, and clay-red on cream / deep-ink.

This repo is a portfolio project: the priorities are **architecture, code quality, and
technical depth** over feature count.

---

## Why it's interesting (architecture highlights)

**1. Append-only ledger → derived balances.** Expenses and settlements are an immutable
log. Per-member balances are *never stored* — they're recomputed from the log by a pure
reducer ([`engine.ts`](src/features/balances/engine.ts)). This makes offline / optimistic
writes **conflict-free** (appends never collide, unlike concurrent edits to a shared
`balance` field) and makes the core trivially unit-testable.

**2. Debt simplification runs client-side.** A greedy min-cash-flow algorithm
([`simplifyDebts`](src/features/balances/engine.ts)) minimizes the number of settle-up
transactions. It's a cheap pure function over already-loaded balances — no Cloud Function
round-trip, works offline.

**3. Money is always integer minor units.** No floats. Parsing happens once at the input
boundary; all math is integer; formatting happens once at display
([`lib/money`](src/lib/money/index.ts)). Split allocation uses the **largest-remainder
method** so parts always sum *exactly* to the total — no lost or phantom paise.

**4. Firestore listeners, not React Query.** Firestore already provides a real-time cache
with offline persistence and latency compensation; React Query would duplicate or fight
it and has no first-class subscription model. Thin typed hooks
([`useFirestore.ts`](src/lib/hooks/useFirestore.ts)) wrap `onSnapshot` to give
`{ data, loading, error }` ergonomics plus a `hasPendingWrites` flag for optimistic UI.

**5. Membership-scoped security rules with a self-join diff.** Access is scoped to the
denormalized `memberIds` array. The marquee rule lets a non-member self-join by appending
**only their own uid** — proven with Firestore's `diff().affectedKeys()`
([`firestore.rules`](firestore.rules)). *Honest limitation noted in the rules: the
`sum(splits) == amount` invariant can't be expressed in rules (no array reduce), so it's
enforced client-side in [`assertBalanced`](src/features/expenses/service.ts).*

**6. Optimistic writes use client timestamps where it matters.** Docs written with
`serverTimestamp()` are invisible to `orderBy('createdAt')` queries until the server
resolves them — so feed-ordered docs use `Timestamp.now()` and appear instantly under
latency compensation; non-ordered fields keep `serverTimestamp()`.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Runtime | Expo SDK 56, React Native 0.85, React 19 (React Compiler on) |
| Routing | Expo Router (file-based, typed routes) |
| Styling | NativeWind v4 (Tailwind) + CSS-variable theming, light/dark |
| Backend | Firebase Auth + Firestore (client-first; Cloud Functions reserved for Phase 5) |
| Local state | Zustand (session, theme, toasts) |
| Server state | Direct Firestore `onSnapshot` listeners |
| Forms | react-hook-form + Zod |
| Animation | Reanimated 4 |
| Type / money | Fraunces (display) · Geist (UI) · Geist Mono (figures) |

---

## Project structure

```
src/
├── app/                      # Expo Router routes (thin screens)
│   ├── (auth)/               # sign-in / sign-up (guarded: redirects if authed)
│   ├── (app)/                # authed area (guarded: redirects if not)
│   │   ├── index.tsx         # groups list (home)
│   │   ├── create-group, join, profile
│   │   └── group/[groupId]/  # detail, add-expense, settle, members
│   └── join/[code].tsx       # deep-link invite handler
├── components/ui/            # design system (Firestore-agnostic)
├── features/                 # auth · groups · expenses · balances · settlements
│   └── balances/engine.ts    # ← pure reducer + debt simplification (tested)
├── lib/                      # firebase · hooks · money · cn/color/date
├── store/                    # zustand stores
├── theme/                    # tokens + light/dark controller
└── validation/               # zod schemas
```

---

## Data model (Firestore)

```
users/{uid}
groups/{groupId}                       # memberIds[] (denormalized), inviteCode, type, currency, budget?
  members/{uid}                        # role, denormalized displayName/photo
  expenses/{id}                        # amount, paidBy[], splits[] (embedded), splitMethod, deletedAt?
  settlements/{id}                     # fromUserId, toUserId, amount
  recurringBills/{id}                  # Phase 5
invites/{code}                         # → groupId  (keeps join logic clean & private)
```

Key denormalization tradeoffs are documented inline in [`lib/types.ts`](src/lib/types.ts):
`memberIds` powers both rules and the "my groups" query; `splits` are **embedded** on the
expense (always read together, written atomically) instead of a separate collection.

---

## Running it

```bash
npm install

# Option A — fully local, no Firebase project needed:
npm i -g firebase-tools
firebase emulators:start                 # Auth :9099, Firestore :8080
# set EXPO_PUBLIC_USE_EMULATOR=true in .env (see .env.example)

# Option B — real project: copy .env.example → .env and fill in the web config

npm start                                # then press i / a, or scan in Expo Go
```

### Quality gates

```bash
npm run typecheck     # tsc --noEmit (clean)
npm test              # Jest — money + balance-engine unit tests (20 passing)
npm run lint          # expo lint
```

The pure-logic tests are the correctness proof: largest-remainder split allocation
(`₹100 ÷ 3 → 34/33/33`, always sums back), the balance reducer (always nets to zero,
ignores soft-deletes, multi-payer), and debt simplification (≤ n−1 transfers, conserves
money). See [`money.test.ts`](src/lib/money/money.test.ts) and
[`engine.test.ts`](src/features/balances/engine.test.ts).

---

## Build status & roadmap

**Built (Phase 1–2):** email/password auth + persisted session, create/join groups (invite
code + deep link), real-time group ledger, add-expense with **equal / exact / percent**
splits (live-validated), settle-up with **minimized** suggested payments, derived
balances, activity feed, members/invite, light/dark + haptics + skeletons + custom empty
states + toasts.

**Next (per the plan):**
- **Phase 3** — Trip budget tracker (planned vs spent, daily burn) — pure client logic.
- **Phase 4** — Settle-up celebration animation, deeper motion polish.
- **Phase 5** — Cloud Functions: push fan-out, scheduled recurring bills (idempotent),
  guest links; gamification (streaks/badges).
- **Phase 6** — `@firebase/rules-unit-testing` suite, EAS build profiles, deploy prep.
