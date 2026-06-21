import { z } from 'zod';

// ---- Auth ----
export const signInSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(2, 'Tell us your name'),
});
export type SignUpValues = z.infer<typeof signUpSchema>;

// ---- Group ----
export const groupTypeSchema = z.enum(['trip', 'home', 'event']);

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, 'Give the group a name'),
  type: groupTypeSchema,
  currency: z.string().length(3),
});
export type CreateGroupValues = z.infer<typeof createGroupSchema>;

export const joinGroupSchema = z.object({
  code: z.string().trim().min(4, 'Enter the invite code').toUpperCase(),
});
export type JoinGroupValues = z.infer<typeof joinGroupSchema>;

// ---- Buddy ----
export const addBuddySchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
});
export type AddBuddyValues = z.infer<typeof addBuddySchema>;

// ---- Expense ----
export const splitMethodSchema = z.enum(['equal', 'exact', 'percent']);

export const addExpenseSchema = z.object({
  description: z.string().trim().min(1, 'What was it for?'),
  amount: z.string().trim().min(1, 'Enter an amount'),
  paidBy: z.string().min(1),
  splitMethod: splitMethodSchema,
  // participants and per-member values are validated in the form logic against
  // the money helpers (sum must equal the total), not statically here.
});
export type AddExpenseValues = z.infer<typeof addExpenseSchema>;
