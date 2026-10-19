import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { Permission } from "../auth/permissions";

export interface NavItem {
  to: string;
  label: string;
  permission?: Permission;
}

/** Ortak sayfa iskeleti: üst bar + yetkiye göre süzülmüş menü. */
export default function AppLayout({ nav, children }: { nav: NavItem[]; children: ReactNode }) {
  const { profile, can, logout } = useAuth();
  const visible = nav.filter((n) => !n.permission || can(n.permission));

  return (
    <div className="app-shell">
      <header className="topbar">
        <strong>ProviderGate FVVK</strong>
        <div className="topbar-user">
          <span>
            {profile?.displayName}
            <span className="badge">{profile?.userType === "supplier" ? "Tedarikçi" : "Çalışan"}</span>
          </span>
          <button className="link-btn" onClick={logout}>
            Çıkış
          </button>
        </div>
      </header>
      <div className="app-body">
        <nav className="sidenav">
          {visible.map((n) => (
            <NavLink key={n.to} to={n.to} end>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
