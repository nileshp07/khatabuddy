/**
 * `getReactNativePersistence` ships only in firebase's `react-native` export
 * condition, but the package's `exports` map surfaces the web type definitions
 * first, so TypeScript can't see it (Metro resolves the RN build at runtime).
 * Re-declare it here so the typed import in lib/firebase/init.ts compiles.
 */
import type { AsyncStorageStatic } from '@react-native-async-storage/async-storage';
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: AsyncStorageStatic): Persistence;
}
