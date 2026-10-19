import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { Permission, UserType } from "./permissions";

function FullPageMessage({ children }: { children: ReactNode }) {
  return <div className="page-message">{children}</div>;
}

/**
 * Sayfa koruması.
 * - Giriş yapılmamışsa → /giris
 * - Kullanıcı tipi uymuyorsa veya yetki yoksa → /yetkisiz
 */
export function RequireAuth({
  children,
  userType,
  permission,
}: {
  children: ReactNode;
  userType?: UserType;
  permission?: Permission;
}) {
  const { status, profile, can } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageMessage>Yükleniyor…</FullPageMessage>;
  if (status === "signedOut") return <Navigate to="/giris" replace state={{ from: location }} />;
  if (status === "noProfile" || status === "inactive" || !profile) return <Navigate to="/yetkisiz" replace />;
  if (userType && profile.userType !== userType) return <Navigate to="/yetkisiz" replace />;
  if (permission && !can(permission)) return <Navigate to="/yetkisiz" replace />;

  return <>{children}</>;
}

/**
 * Sayfa içi buton/alan koruması. Yetki yoksa hiçbir şey çizmez
 * (veya `fallback` verilirse onu çizer, ör. salt-okunur görünüm).
 */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = useAuth();
  return <>{can(permission) ? children : fallback}</>;
}

/** Kullanıcı tipine göre doğru ana sayfaya yönlendirir. */
export function homePathFor(userType: UserType): string {
  return userType === "supplier" ? "/tedarikci" : "/panel";
}
