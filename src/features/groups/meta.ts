import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { GroupType } from '@/lib/types';

type FeatherName = ComponentProps<typeof Feather>['name'];

export const GROUP_TYPE_META: Record<
  GroupType,
  { label: string; icon: FeatherName; blurb: string }
> = {
  trip: { label: 'Trip', icon: 'map', blurb: 'A getaway with shared costs' },
  home: { label: 'Home', icon: 'home', blurb: 'Flatmates, rent & recurring bills' },
  event: { label: 'Event', icon: 'gift', blurb: 'A one-off occasion' },
};

export const GROUP_TYPES: GroupType[] = ['trip', 'home', 'event'];

/** A small, sensible set of currencies for the picker. */
export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'AED', 'SGD'];
