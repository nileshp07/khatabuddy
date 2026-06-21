import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type FeatherName = ComponentProps<typeof Feather>['name'];

export interface Category {
  id: string;
  label: string;
  icon: FeatherName;
}

export const CATEGORIES: Category[] = [
  { id: 'general', label: 'General', icon: 'tag' },
  { id: 'food', label: 'Food & drink', icon: 'coffee' },
  { id: 'groceries', label: 'Groceries', icon: 'shopping-cart' },
  { id: 'transport', label: 'Transport', icon: 'navigation' },
  { id: 'stay', label: 'Stay', icon: 'home' },
  { id: 'activities', label: 'Activities', icon: 'compass' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping-bag' },
  { id: 'bills', label: 'Bills', icon: 'file-text' },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function categoryIcon(id: string | undefined): FeatherName {
  return BY_ID.get(id ?? 'general')?.icon ?? 'tag';
}
