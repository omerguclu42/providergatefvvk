import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { homePathFor } from "../auth/guards";

export default function UnauthorizedPage() {
  const { profile, logout } = useAuth();
  return (
    <div className="page-message">
      <h1>Bu sayfaya erişim yetkiniz yok</h1>
      <p className="muted">Yetki talebi için sistem yöneticinizle iletişime geçin.</p>
      <div className="row">
        {profile?.active && <Link to={homePathFor(profile.userType)}>Ana sayfaya dön</Link>}
        <button className="link-btn" onClick={logout}>
          Farklı hesapla giriş yap
        </button>
      </div>
    </div>
  );
}
