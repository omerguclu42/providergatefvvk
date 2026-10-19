import AppLayout, { type NavItem } from "../../components/AppLayout";
import { useAuth } from "../../auth/AuthContext";

export const EMPLOYEE_NAV: NavItem[] = [
  { to: "/panel", label: "Özet" },
  { to: "/panel/hizmetler", label: "Hizmet Dosyaları", permission: "services.view" },
  { to: "/panel/fiyatlandirma", label: "Fiyatlandırma", permission: "pricing.view" },
  { to: "/panel/faturalar", label: "Faturalar", permission: "invoices.view" },
  { to: "/panel/raporlar", label: "Raporlar", permission: "reports.view" },
  { to: "/panel/yonetim", label: "Yönetim", permission: "admin.users" },
];

export default function EmployeeHome() {
  const { profile, permissions } = useAuth();
  return (
    <AppLayout nav={EMPLOYEE_NAV}>
      <h1>Hoş geldiniz, {profile?.displayName}</h1>
      <p className="muted">Roller: {profile?.roles?.join(", ") || "—"}</p>
      <p>Bu hesapta tanımlı yetkiler: {[...permissions].join(", ") || "yok"}</p>
    </AppLayout>
  );
}
