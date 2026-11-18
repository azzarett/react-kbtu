import { getApps, initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";

const env = import.meta.env;
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};
export const firebaseConfigured = [firebaseConfig.apiKey, firebaseConfig.authDomain,
  firebaseConfig.projectId, firebaseConfig.appId].every(Boolean);
let ready;

// One initialization and persistence handshake, including under StrictMode.
export function getPersistentAuth() {
  if (!firebaseConfigured) return Promise.reject(Object.assign(
    new Error("Firebase is not configured"), { code: "auth/missing-config" },
  ));
  if (!ready) ready = (async () => {
    const app = getApps().find((item) => item.name === "[DEFAULT]") ?? initializeApp(firebaseConfig);
    const auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);
    return auth;
  })().catch((error) => { ready = undefined; throw error; });
  return ready;
}
