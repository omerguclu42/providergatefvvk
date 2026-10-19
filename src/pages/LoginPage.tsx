import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../auth/AuthContext";
import { homePathFor } from "../auth/guards";
import { db, firebaseConfigured } from "../lib/firebase";

function errorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
      case "auth/invalid-email":
        return "Kullanıcı adı veya şifre hatalı.";
      case "auth/too-many-requests":
        return "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
      case "auth/user-disabled":
        return "Bu hesap devre dışı bırakılmış. Yöneticinizle iletişime geçin.";
      case "auth/network-request-failed":
        return "Bağlantı hatası. İnternet bağlantınızı kontrol edin.";
    }
  }
  return "Giriş yapılamadı. Lütfen tekrar deneyin.";
}

export default function LoginPage() {
  const { status, profile, login } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "system", "setup"))
      .then((s) => setSetupOpen(!s.exists()))
      .catch(() => setSetupOpen(false));
  }, []);

  if (status === "signedIn" && profile) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
    return <Navigate to={from ?? homePathFor(profile.userType)} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Kullanıcı adı ve şifre zorunludur.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <aside className="login-brand">
        <div className="brand-mark" aria-hidden>
          PG
        </div>
        <h1>ProviderGate</h1>
        <p className="brand-sub">FVVK Tedarikçi Portalı</p>
        <ul className="brand-steps">
          <li>Atanan hizmetleri takip edin</li>
          <li>Statüleri güncelleyin ve dosyayı kapatın</li>
          <li>Fiyatlandırın, faturanızı yükleyin</li>
        </ul>
      </aside>

      <main className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <h2>Giriş yap</h2>
          <p className="muted">Tedarikçi ve şirket çalışanları aynı ekrandan giriş yapar.</p>

          {!firebaseConfigured && (
            <div className="alert warn">
              Firebase yapılandırması eksik. <code>.env.local</code> dosyasını doldurun.
            </div>
          )}
          {status === "noProfile" && (
            <div className="alert error">Hesabınıza tanımlı bir profil bulunamadı. Yöneticinizle iletişime geçin.</div>
          )}
          {status === "inactive" && <div className="alert error">Hesabınız pasif durumda.</div>}
          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}

          <label htmlFor="username">Kullanıcı adı</label>
          <input
            id="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ör. ahmet.yilmaz"
          />

          <label htmlFor="password">Şifre</label>
          <div className="password-field">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="link-btn" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? "Gizle" : "Göster"}
            </button>
          </div>

          <button type="submit" className="primary" disabled={submitting || status === "loading"}>
            {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
          </button>

          <p className="muted small">Şifrenizi unuttuysanız sistem yöneticinizle iletişime geçin.</p>
          {setupOpen && (
            <p className="small" style={{ textAlign: "center", margin: "8px 0 0" }}>
              Sistem henüz kurulmamış. <Link to="/kurulum">İlk kurulumu başlat</Link>
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
