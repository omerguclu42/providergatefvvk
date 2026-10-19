import { initializeApp, deleteApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const env = import.meta.env;

// Web config değerleri herkese açıktır (tarayıcıya zaten gönderilir);
// verileri koruyan Firestore güvenlik kurallarıdır. .env.local ile ezilebilir.
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAkV6oBJiLpFenqYupCPLKD1BVAn-t8Zto",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "providergatefvvk.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "providergatefvvk",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "providergatefvvk.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "274007406770",
  appId: env.VITE_FIREBASE_APP_ID || "1:274007406770:web:5139fc417ae25cdfac71ab",
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.appId);

const app = initializeApp(firebaseConfig);

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

/** Kullanıcı adı kuralı: küçük harf, rakam, nokta, alt çizgi, tire; 3-32 karakter */
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

/**
 * Yöneticinin oturumunu bozmadan yeni bir Auth hesabı açar.
 * (Normal createUser çağrısı mevcut oturumu yeni kullanıcıya geçirir;
 * bu yüzden geçici, ikinci bir Firebase uygulaması kullanılır.)
 */
export async function createAuthAccount(username: string, password: string): Promise<string> {
  const secondary = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  try {
    const secondaryAuth = getAuth(secondary);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, usernameToEmail(username), password);
    await signOut(secondaryAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(secondary);
  }
}
