import type { ReactNode } from 'react';
import { View } from 'react-native';

import { IconButton } from './IconButton';
import { Text } from './Text';

export interface ScreenHeaderProps {
	title: string;
	subtitle?: string;
	onBack?: () => void;
	right?: ReactNode;
}

export function ScreenHeader({title, subtitle, onBack, right}: ScreenHeaderProps) {
	return (
		<View className='flex-row items-center gap-3 px-5 pb-2 mt-4'>
			{onBack ? (
				<IconButton icon='chevron-left' variant='surface' onPress={onBack} accessibilityLabel='Go back' />
			) : null}
			<View className='flex-1'>
				<Text variant='title' numberOfLines={1}>
					{title}
				</Text>
				{subtitle ? (
					<Text variant='caption' numberOfLines={1}>
						{subtitle}
					</Text>
				) : null}
			</View>
			{right}
		</View>
	);
}
