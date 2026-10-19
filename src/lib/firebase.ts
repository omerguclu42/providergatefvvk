import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const env = import.meta.env;

export const firebaseConfigured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_APP_ID);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || "missing",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || "providergatefvvk",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);
export const db = getFirestore(app);

const USERNAME_DOMAIN = env.VITE_USERNAME_DOMAIN || "users.providergatefvvk.app";

/**
 * Firebase Auth e-posta ister. Kullanıcı adıyla girişi desteklemek için
 * kullanıcı adı iç bir alan adına eklenerek e-postaya çevrilir.
 * "@" içeren girişler doğrudan e-posta olarak kullanılır.
 */
export function usernameToEmail(input: string): string {
  const value = input.trim().toLowerCase();
  return value.includes("@") ? value : `${value}@${USERNAME_DOMAIN}`;
}
