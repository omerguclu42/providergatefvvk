// Firebase bağlantısı (CDN üzerinden, derleme gerektirmez)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkV6oBJiLpFenqYupCPLKD1BVAn-t8Zto",
  authDomain: "providergatefvvk.firebaseapp.com",
  projectId: "providergatefvvk",
  storageBucket: "providergatefvvk.firebasestorage.app",
  messagingSenderId: "274007406770",
  appId: "1:274007406770:web:5139fc417ae25cdfac71ab",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Kullanıcı adıyla giriş: "ahmet.yilmaz" -> "ahmet.yilmaz@users.providergatefvvk.app"
// "@" içeren girişler doğrudan e-posta olarak kullanılır.
export const USERNAME_DOMAIN = "users.providergatefvvk.app";

export function usernameToEmail(input) {
  const value = input.trim().toLowerCase();
  return value.includes("@") ? value : `${value}@${USERNAME_DOMAIN}`;
}
