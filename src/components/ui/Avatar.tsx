import { Image } from 'expo-image';
import { View } from 'react-native';

import { Text } from './Text';

const SWATCHES = ['#E0913A', '#126B5B', '#C0492C', '#3FA88F', '#7A5C9E', '#2E6F95', '#B5683A'];

function hashIndex(value: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash) % modulo;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
}

export function Avatar({ name, uri, size = 40 }: AvatarProps) {
  const radius = size / 2;
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
        transition={150}
      />
    );
  }
  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: SWATCHES[hashIndex(name || '?', SWATCHES.length)],
      }}
    >
      <Text className="font-sans-sb text-white" style={{ fontSize: size * 0.4 }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}
