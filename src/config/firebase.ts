/**
 * 🔥 FIREBASE CONFIGURATION
 * ═══════════════════════════════════════════════════════════
 * 
 * Firebase Realtime Database for tree sync.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a project (e.g., "vansh-family")
 * 3. Enable Realtime Database (Start in test mode)
 * 4. Copy your config values below
 * 5. That's it — sync works!
 * 
 * Free tier: 1GB storage, 10GB/month download — more than enough.
 */

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// ═══════════════════════════════════════════════════════════
// FIREBASE CONFIG — Replace with your project's values
// ═══════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey: "***REMOVED-LEAKED-FIREBASE-KEY***",
  authDomain: "vansh-f88c2.firebaseapp.com",
  databaseURL: "https://vansh-f88c2-default-rtdb.firebaseio.com",
  projectId: "vansh-f88c2",
  storageBucket: "vansh-f88c2.firebasestorage.app",
  messagingSenderId: "214412748064",
  appId: "1:214412748064:web:a7a6f214efaa208afd6345",
  measurementId: "G-13F44H7S09"
};

// Check if Firebase is configured
export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith('YOUR_');

let app: ReturnType<typeof initializeApp> | null = null;
let db: ReturnType<typeof getDatabase> | null = null;

if (isFirebaseConfigured) {
  try {
    // Reuse existing app instance on hot-reloads (avoids duplicate-app error)
    const existingApps = getApps();
    app = existingApps.length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log('🔥 Firebase initialized for tree sync');
  } catch (e: any) {
    // If duplicate-app error, just retrieve the existing one
    if (e?.code === 'app/duplicate-app') {
      try {
        app = getApp();
        db = getDatabase(app);
        console.log('🔥 Firebase reused existing app instance');
      } catch (e2) {
        console.warn('⚠️ Firebase initialization failed:', e2);
      }
    } else {
      console.warn('⚠️ Firebase initialization failed:', e);
    }
  }
} else {
  console.log('⚠️ Firebase not configured — tree sync disabled. See src/config/firebase.ts');
}

export { app as firebaseApp, db as firebaseDb };

