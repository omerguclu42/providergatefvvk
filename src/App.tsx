import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { RequireAuth, homePathFor } from "./auth/guards";
import LoginPage from "./pages/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import SupplierHome from "./pages/supplier/SupplierHome";
import EmployeeHome from "./pages/employee/EmployeeHome";

function RootRedirect() {
  const { status, profile } = useAuth();
  if (status === "loading") return <div className="page-message">Yükleniyor…</div>;
  if (status === "signedIn" && profile) return <Navigate to={homePathFor(profile.userType)} replace />;
  return <Navigate to="/giris" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/giris" element={<LoginPage />} />
          <Route path="/yetkisiz" element={<UnauthorizedPage />} />

          {/* Tedarikçi alanı */}
          <Route
            path="/tedarikci/*"
            element={
              <RequireAuth userType="supplier">
                <SupplierHome />
              </RequireAuth>
            }
          />

          {/* Şirket çalışanı alanı */}
          <Route
            path="/panel/*"
            element={
              <RequireAuth userType="employee">
                <EmployeeHome />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
