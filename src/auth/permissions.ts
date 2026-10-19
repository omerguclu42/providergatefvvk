/**
 * ProviderGate FVVK – yetki kataloğu
 *
 * İki ana kullanıcı tipi vardır:
 *   - "supplier"  : Tedarikçi firma kullanıcısı. Sadece kendi firmasına atanan
 *                   dosyaları görür; yetkileri sabit bir set ile sınırlıdır.
 *   - "employee"  : Şirket (asistans firması) çalışanı. Yetkileri, kendisine
 *                   atanan rollerin birleşiminden oluşur.
 *
 * Yetki adları "<modül>.<eylem>" biçimindedir. "view" sayfayı görmeyi,
 * diğer eylemler o sayfada işlem yapmayı temsil eder.
 */

export type UserType = "supplier" | "employee";

export const PERMISSIONS = {
  // Hizmet dosyaları
  "services.view": "Hizmet dosyalarını görüntüleme",
  "services.create": "Yeni hizmet dosyası açma / tedarikçiye atama",
  "services.updateStatus": "Hizmet statüsünü ilerletme",
  "services.close": "Hizmeti sonlandırma",

  // Fiyatlandırma
  "pricing.view": "Fiyatlandırmayı görüntüleme",
  "pricing.edit": "Dosya fiyatı girme / düzenleme",
  "pricing.approve": "Fiyatı onaylama",

  // Faturalandırma
  "invoices.view": "Faturaları görüntüleme",
  "invoices.upload": "Fatura yükleme ve gönderme",
  "invoices.approve": "Faturayı onaylama (Finans)",
  "invoices.reject": "Faturayı reddetme / düzeltmeye gönderme",

  // Raporlar
  "reports.view": "Raporları görüntüleme",

  // Yönetim
  "admin.users": "Kullanıcı yönetimi",
  "admin.roles": "Rol ve yetki yönetimi",
  "admin.suppliers": "Tedarikçi firma yönetimi",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

/**
 * Tedarikçi kullanıcılarının alabileceği en geniş yetki seti.
 * Bir tedarikçi kullanıcısının profiline bu liste dışında bir yetki yazılsa
 * bile uygulama onu yok sayar (bkz. resolvePermissions).
 */
export const SUPPLIER_ALLOWED: readonly Permission[] = [
  "services.view",
  "services.updateStatus",
  "services.close",
  "pricing.view",
  "pricing.edit",
  "invoices.view",
  "invoices.upload",
];

/**
 * Başlangıç rolleri. Firestore'daki `roles` koleksiyonuna ilk kurulumda
 * bu tanımlarla yazılır; sonrasında yönetim ekranından değiştirilebilir.
 */
export const DEFAULT_ROLES: Record<string, { name: string; permissions: Permission[] }> = {
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
    permissions: [...ALL_PERMISSIONS],
  },
};

/** Firestore `users/{uid}` dokümanının şekli */
export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  userType: UserType;
  /** Sadece tedarikçiler için: bağlı olduğu tedarikçi firma */
  supplierId?: string;
  /** Sadece çalışanlar için: atanmış rol ID'leri */
  roles?: string[];
  /** Rol dışında kişiye özel eklenen yetkiler */
  extraPermissions?: Permission[];
  active: boolean;
}

/**
 * Kullanıcının nihai yetki setini hesaplar.
 * - Pasif kullanıcı hiçbir yetki alamaz.
 * - Tedarikçi: kişisel yetkiler (yoksa tüm tedarikçi seti), SUPPLIER_ALLOWED ile kesişim.
 * - Çalışan: rollerin yetkileri + kişisel ek yetkiler.
 */
export function resolvePermissions(
  profile: UserProfile,
  roleMap: Record<string, Permission[]>,
): Set<Permission> {
  if (!profile.active) return new Set();

  if (profile.userType === "supplier") {
    const base = profile.extraPermissions?.length ? profile.extraPermissions : SUPPLIER_ALLOWED;
    return new Set(base.filter((p) => SUPPLIER_ALLOWED.includes(p)));
  }

  const result = new Set<Permission>();
  for (const roleId of profile.roles ?? []) {
    for (const p of roleMap[roleId] ?? []) result.add(p);
  }
  for (const p of profile.extraPermissions ?? []) result.add(p);
  return result;
}
