/**
 * Firebase config is read from public Expo env vars (EXPO_PUBLIC_*), which are
 * inlined at build time. Copy `.env.example` to `.env` and fill these in, or set
 * EXPO_PUBLIC_USE_EMULATOR=true to run fully against the local Firebase emulator
 * suite (no real project required — see README).
 */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo-khatabuddy.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-khatabuddy',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'demo-khatabuddy.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '0000000000',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:0000000000:web:demo',
};

export const useEmulator = process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';

/** Emulator host. Android emulators reach the host machine via 10.0.2.2. */
export const emulatorHost = process.env.EXPO_PUBLIC_EMULATOR_HOST ?? 'localhost';
