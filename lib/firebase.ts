import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Without the public Firebase env vars (e.g. Vercel Preview builds, which only
// carry them in the Production scope), apiKey is undefined and getAuth() throws
// auth/invalid-api-key while prerendering /_not-found, failing the whole build.
// Initialize only when the config is present — production and every browser
// have it, so this is a no-op there and just stops config-less builds crashing.
const hasConfig = Boolean(firebaseConfig.apiKey);

const app: FirebaseApp | undefined = hasConfig
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : undefined;

export const auth = (app ? getAuth(app) : undefined) as Auth;
export const db = (app ? getFirestore(app) : undefined) as Firestore;
