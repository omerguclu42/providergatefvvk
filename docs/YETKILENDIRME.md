# Yetkilendirme Tasarımı

## 1. Giriş: kullanıcı adı ile

Firebase Authentication e-posta + şifre ile çalışır. Kullanıcı adıyla giriş için
kullanıcı adı arka planda iç bir e-postaya çevrilir:

```
ahmet.yilmaz  →  ahmet.yilmaz@users.providergatefvvk.app
```

- Bu e-postalar gerçek değildir, yalnızca giriş anahtarıdır. Kullanıcı bunu hiç görmez.
- Girişte "@" yazılırsa doğrudan e-posta olarak kullanılır (ör. yönetici hesapları).
- Kullanıcıları **yalnızca yönetici açar**, dışarıdan kayıt yoktur.
- Şifre sıfırlamayı da yönetici yapar, çünkü iç e-postalara posta gitmez.
- Bu yaklaşım kullanıcı adı → e-posta eşleme tablosunu herkese açık bırakma riskini de ortadan kaldırır.

## 2. İki ana kullanıcı tipi

| | Tedarikçi (`supplier`) | Şirket çalışanı (`employee`) |
|---|---|---|
| Giriş sonrası | `/tedarikci` | `/panel` |
| Gördüğü veri | Yalnızca kendi firmasına (`supplierId`) atanan dosyalar | Rolüne göre tüm dosyalar |
| Yetki kaynağı | Sabit tedarikçi seti (daraltılabilir, genişletilemez) | Atanan rollerin birleşimi + kişisel ek yetkiler |

Bir tedarikçi kullanıcısı çalışan sayfalarına URL yazarak da giremez. Hem arayüz
koruması (`RequireAuth userType="employee"`) hem de Firestore kuralları bunu engeller.

## 3. Yetkiler: "görebilme" ve "işlem yapabilme" ayrı

Her yetki `modül.eylem` biçimindedir:

- `*.view` → sayfayı ve menü öğesini görür
- `*.edit`, `*.approve`, `*.upload`, `*.updateStatus` … → o sayfada ilgili butonu kullanır

Böylece bir kullanıcı faturaları görebilir (`invoices.view`) ama onaylayamaz
(`invoices.approve` yoksa onay butonu çizilmez).

Tam liste: `src/auth/permissions.ts`.

## 4. Roller (şirket çalışanları)

Başlangıç rolleri aşağıda. Firestore `roles/{rolId}` koleksiyonunda tutulur,
ileride yönetim ekranından düzenlenecek.

| Rol | Özet |
|---|---|
| `operation` – Operasyon | Dosya açar, tedarikçiye atar, statü ilerletir |
| `pricing` – Fiyatlandırma | Fiyat girer ve onaylar |
| `finance` – Finans/Muhasebe | Faturayı onaylar veya reddeder, rapor görür |
| `manager` – Yönetici | Her şeyi görür, işlem yapmaz |
| `admin` – Sistem Yöneticisi | Tüm yetkiler, kullanıcı ve rol yönetimi |

Bir çalışana birden fazla rol verilebilir. Yetkiler birleşir.

## 5. Veri modeli

```
users/{uid}
  username: "ahmet.yilmaz"
  displayName: "Ahmet Yılmaz"
  userType: "employee" | "supplier"
  supplierId: "TED-001"          # sadece tedarikçi
  roles: ["operation","finance"] # sadece çalışan
  extraPermissions: [...]        # opsiyonel
  active: true

roles/{roleId}
  name: "Finans / Muhasebe"
  permissions: ["invoices.view","invoices.approve", ...]

suppliers/{supplierId}
  name, vergiNo, iletişim ...
```

## 6. Kodda kullanım

```tsx
// Sayfa koruması
<RequireAuth userType="employee" permission="invoices.view"> ... </RequireAuth>

// Buton koruması
<Can permission="invoices.approve"><button>Onayla</button></Can>

// Mantık içinde
const { can } = useAuth();
if (can("services.close")) { ... }
```

## 7. Güvenlik katmanları

1. **Arayüz:** menü ve butonlar yetkiye göre gizlenir. Bu katman kullanıcı deneyimi içindir, güvenlik sağlamaz.
2. **Firestore kuralları:** asıl koruma burada. Yetkisiz okuma ve yazma sunucu tarafında reddedilir.
3. **Statü geçişleri (sonraki aşama):** bir statüden diğerine kimin geçirebileceği
   Cloud Functions ile sunucuda doğrulanacak. Her geçiş bir geçmiş (audit log) kaydı oluşturacak.

**Sonraki iyileştirme:** Yetkiler Cloud Function ile Firebase *custom claims*'e yazılacak.
Böylece kurallar her istekte profil dokümanı okumak zorunda kalmaz; hem hızlanır hem ucuzlar.
