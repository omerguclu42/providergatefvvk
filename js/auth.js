// Sayfa koruması ve yetki kontrolü
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { auth, db } from "./firebase.js";
import { resolvePermissions, homePageFor, ROLES } from "./permissions.js";

/** Giriş yapmış kullanıcının Firestore profilini getirir (yoksa null). */
export async function loadProfile(user) {
  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.exists() ? { uid: user.uid, ...snap.data() } : null;
}

/**
 * Korumalı sayfaların başında çağrılır.
 *   await requireAuth({ userType: "employee", permission: "invoices.view" })
 * - Giriş yoksa → index.html
 * - Profil yok / pasif / tip uymuyor / yetki yok → yetkisiz.html
 * Başarılıysa { user, profile, permissions, can } döner ve sayfayı görünür yapar.
 */
export function requireAuth({ userType, permission } = {}) {
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, async (user) => {
      stop();
      if (!user) return location.replace("index.html");

      let profile = null;
      try {
        profile = await loadProfile(user);
      } catch (e) {
        console.error("Profil okunamadı", e);
      }
      const permissions = resolvePermissions(profile);
      const can = (p) => permissions.has(p);

      if (!profile || profile.active !== true) return location.replace("yetkisiz.html");
      if (userType && profile.userType !== userType) return location.replace("yetkisiz.html");
      if (permission && !can(permission)) return location.replace("yetkisiz.html");

      applyPermissions(can);
      fillUserInfo(profile);
      document.body.classList.remove("loading");
      resolve({ user, profile, permissions, can });
    });
  });
}

/**
 * HTML'de data-permission="invoices.approve" taşıyan öğeleri,
 * yetki yoksa sayfadan kaldırır. (Menü öğeleri, butonlar vb.)
 */
export function applyPermissions(can, root = document) {
  root.querySelectorAll("[data-permission]").forEach((el) => {
    if (!can(el.dataset.permission)) el.remove();
  });
}

function fillUserInfo(profile) {
  document.querySelectorAll("[data-user-name]").forEach((el) => (el.textContent = profile.displayName || profile.username || ""));
  document.querySelectorAll("[data-user-type]").forEach(
    (el) => (el.textContent = profile.userType === "supplier" ? "Tedarikçi" : "Çalışan"),
  );
  document.querySelectorAll("[data-user-roles]").forEach(
    (el) => (el.textContent = (profile.roles ?? []).map((r) => ROLES[r]?.name ?? r).join(", ") || "—"),
  );
  document.querySelectorAll("[data-supplier-id]").forEach((el) => (el.textContent = profile.supplierId ?? "—"));
  document.querySelectorAll("[data-logout]").forEach((el) =>
    el.addEventListener("click", async () => {
      await signOut(auth);
      location.replace("index.html");
    }),
  );
}

export { homePageFor };
