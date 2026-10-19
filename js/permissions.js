// ProviderGate FVVK – yetki kataloğu ve roller
//
// İki ana kullanıcı tipi:
//   "supplier"  : Tedarikçi. Sadece kendi firmasına atanan dosyaları görür.
//   "employee"  : Şirket çalışanı. Yetkileri atanan rollerin birleşimidir.
//
// Yetki adı "modül.eylem" biçimindedir: "view" görmeyi, diğerleri işlem yapmayı temsil eder.

export const PERMISSIONS = {
  "services.view": "Hizmet dosyalarını görüntüleme",
  "services.create": "Yeni hizmet dosyası açma / tedarikçiye atama",
  "services.updateStatus": "Hizmet statüsünü ilerletme",
  "services.close": "Hizmeti sonlandırma",

  "pricing.view": "Fiyatlandırmayı görüntüleme",
  "pricing.edit": "Dosya fiyatı girme / düzenleme",
  "pricing.approve": "Fiyatı onaylama",

  "invoices.view": "Faturaları görüntüleme",
  "invoices.upload": "Fatura yükleme ve gönderme",
  "invoices.approve": "Faturayı onaylama (Finans)",
  "invoices.reject": "Faturayı reddetme / düzeltmeye gönderme",

  "reports.view": "Raporları görüntüleme",

  "admin.users": "Kullanıcı yönetimi",
};

const ALL = Object.keys(PERMISSIONS);

// Tedarikçinin alabileceği en geniş yetki seti
export const SUPPLIER_PERMISSIONS = [
  "services.view",
  "services.updateStatus",
  "services.close",
  "pricing.view",
  "pricing.edit",
  "invoices.view",
  "invoices.upload",
];

// Şirket çalışanı rolleri. Firestore'da kullanıcıya bu ID'ler yazılır: roles: ["finance"]
export const ROLES = {
  operation: {
    name: "Operasyon",
    permissions: ["services.view", "services.create", "services.updateStatus", "services.close", "pricing.view"],
  },
  pricing: {
    name: "Fiyatlandırma",
    permissions: ["services.view", "pricing.view", "pricing.edit", "pricing.approve"],
  },
  finance: {
    name: "Finans / Muhasebe",
    permissions: ["services.view", "pricing.view", "invoices.view", "invoices.approve", "invoices.reject", "reports.view"],
  },
  manager: {
    name: "Yönetici",
    permissions: ["services.view", "pricing.view", "invoices.view", "reports.view"],
  },
  admin: {
    name: "Sistem Yöneticisi",
    permissions: ALL,
  },
};

// Kullanıcının nihai yetki setini hesaplar
export function resolvePermissions(profile) {
  if (!profile || profile.active !== true) return new Set();

  if (profile.userType === "supplier") {
    const base = profile.extraPermissions?.length ? profile.extraPermissions : SUPPLIER_PERMISSIONS;
    return new Set(base.filter((p) => SUPPLIER_PERMISSIONS.includes(p)));
  }

  const result = new Set();
  for (const roleId of profile.roles ?? []) {
    for (const p of ROLES[roleId]?.permissions ?? []) result.add(p);
  }
  for (const p of profile.extraPermissions ?? []) result.add(p);
  return result;
}

export function homePageFor(userType) {
  return userType === "supplier" ? "tedarikci.html" : "panel.html";
}
