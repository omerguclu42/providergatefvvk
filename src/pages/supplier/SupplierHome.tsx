import AppLayout, { type NavItem } from "../../components/AppLayout";
import { useAuth } from "../../auth/AuthContext";

export const SUPPLIER_NAV: NavItem[] = [
  { to: "/tedarikci", label: "Özet" },
  { to: "/tedarikci/hizmetler", label: "Hizmetlerim", permission: "services.view" },
  { to: "/tedarikci/faturalar", label: "Faturalarım", permission: "invoices.view" },
];

export default function SupplierHome() {
  const { profile, permissions } = useAuth();
  return (
    <AppLayout nav={SUPPLIER_NAV}>
      <h1>Hoş geldiniz, {profile?.displayName}</h1>
      <p className="muted">Firma: {profile?.supplierId ?? "—"}</p>
      <p>Bu hesapta tanımlı yetkiler: {[...permissions].join(", ") || "yok"}</p>
    </AppLayout>
  );
}
