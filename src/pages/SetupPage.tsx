import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { auth, db, usernameToEmail, USERNAME_PATTERN } from "../lib/firebase";
import { DEFAULT_ROLES } from "../auth/permissions";
import { useAuth } from "../auth/AuthContext";

/**
 * İlk kurulum: sistemde hiç yönetici yokken ilk "Sistem Yöneticisi"
 * hesabını açar ve varsayılan rolleri oluşturur. Bir kez çalışır;
 * sonrasında Firestore kuralları tekrarını engeller.
 */
export default function SetupPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "open" | "done">("checking");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "system", "setup"))
      .then((s) => setState(s.exists() ? "done" : "open"))
      .catch(() => setState("open"));
  }, []);

  if (state === "checking") return <div className="page-message">Kontrol ediliyor…</div>;
  if (state === "done") return <Navigate to="/giris" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const uname = username.trim().toLowerCase();
    if (!displayName.trim()) return setError("Ad soyad zorunludur.");
    if (!USERNAME_PATTERN.test(uname))
      return setError("Kullanıcı adı 3-32 karakter olmalı; küçük harf, rakam, nokta, alt çizgi veya tire içerebilir.");
    if (password.length < 8) return setError("Şifre en az 8 karakter olmalı.");
    if (password !== password2) return setError("Şifreler eşleşmiyor.");

    setError(null);
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(uname), password);
      const uid = cred.user.uid;
      try {
        // 1) Yönetici profili + kurulum kaydı (aynı anda, kurallar bunu şart koşar)
        const b1 = writeBatch(db);
        b1.set(doc(db, "users", uid), {
          username: uname,
          displayName: displayName.trim(),
          userType: "employee",
          roles: ["admin"],
          active: true,
          createdAt: serverTimestamp(),
        });
        b1.set(doc(db, "system", "setup"), { adminUid: uid, completedAt: serverTimestamp() });
        await b1.commit();

        // 2) Varsayılan roller (artık yönetici yetkisiyle)
        const b2 = writeBatch(db);
        for (const [id, role] of Object.entries(DEFAULT_ROLES)) {
          b2.set(doc(db, "roles", id), { name: role.name, permissions: role.permissions });
        }
        await b2.commit();
      } catch (inner) {
        // Profil yazılamadıysa (ör. kurulum az önce başkası tarafından yapıldı) açılan hesabı geri al
        await deleteUser(cred.user).catch(() => undefined);
        throw inner;
      }
      await refresh();
      navigate("/panel/yonetim", { replace: true });
    } catch (err) {
      console.error(err);
      if (err instanceof FirebaseError && err.code === "auth/email-already-in-use")
        setError("Bu kullanıcı adı zaten kullanılıyor.");
      else if (err instanceof FirebaseError && err.code === "permission-denied")
        setError("Kurulum reddedildi. Firestore güvenlik kuralları yayınlanmamış olabilir veya kurulum zaten yapılmış.");
      else if (err instanceof FirebaseError && err.code === "auth/operation-not-allowed")
        setError("Firebase Authentication'da E-posta/Şifre yöntemi açık değil.");
      else setError("Kurulum tamamlanamadı: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-panel" style={{ minHeight: "100vh" }}>
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <h2>İlk kurulum</h2>
        <p className="muted">
          Sistemin ilk <strong>Sistem Yöneticisi</strong> hesabını oluşturun. Bu ekran yalnızca bir kez kullanılabilir.
        </p>
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        <label htmlFor="dn">Ad soyad</label>
        <input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoFocus />
        <label htmlFor="un">Kullanıcı adı</label>
        <input
          id="un"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ör. omer.guclu"
          autoComplete="username"
        />
        <label htmlFor="pw">Şifre (en az 8 karakter)</label>
        <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <label htmlFor="pw2">Şifre (tekrar)</label>
        <input id="pw2" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" />
        <button type="submit" className="primary" disabled={busy}>
          {busy ? "Kuruluyor…" : "Kurulumu tamamla"}
        </button>
      </form>
    </div>
  );
}
