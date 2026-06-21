/**
 * Firebase singleton init for React Native / Expo.
 *
 * - Auth persists across restarts via AsyncStorage (getReactNativePersistence).
 * - Firestore uses long-polling, which is the reliable transport in the RN/Expo
 *   runtime. Within a session the SDK gives latency compensation (optimistic
 *   writes surface immediately via onSnapshot). Note: durable cross-restart
 *   Firestore cache needs the native SDK; that's intentionally out of scope here.
 * - When EXPO_PUBLIC_USE_EMULATOR=true we wire up the local emulator suite.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  type Firestore,
} from 'firebase/firestore';

import { emulatorHost, firebaseConfig, useEmulator } from './config';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // initializeAuth throws if called twice (Fast Refresh) — reuse the instance.
  // Lazy import avoids a hard dependency cycle on getAuth.
  auth = require('firebase/auth').getAuth(app);
}

const db: Firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

if (useEmulator) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, 8080);
}

export { app, auth, db };
