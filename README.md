# ProviderGate FVVK

Asistans firması ile tedarikçileri arasında hizmet takibi, statü yönetimi,
fiyatlandırma ve faturalandırma portalı (taslak).

**Hedef iş akışı:** Hizmet atanır → tedarikçi statüleri ilerletir ve hizmeti
sonlandırır → dosya fiyatlanır → tedarikçi faturayı yükleyip gönderir → finans
kontrol edip onaylar. Her adım dosyayı yeni bir statüye taşır.

Sade HTML + JavaScript; derleme yok. GitHub Pages ile yayınlanır, Firebase
(Authentication + Firestore) doğrudan sayfadan kullanılır.

## Dosyalar

| Dosya | Görev |
|---|---|
| `index.html` | Giriş sayfası |
| `panel.html` | Şirket çalışanı ana sayfası |
| `tedarikci.html` | Tedarikçi ana sayfası |
| `yetkisiz.html` | Yetkisiz erişim sayfası |
| `js/firebase.js` | Firebase bağlantısı |
| `js/permissions.js` | Yetkiler ve roller |
| `js/auth.js` | Sayfa koruması (`requireAuth`) ve yetkiye göre gizleme |
| `firestore.rules` | Firestore güvenlik kuralları (konsola yapıştırılır) |

## Kullanıcı ekleme (Firebase konsolu)

**1. Authentication → Users → Add user**
- E-posta: `kullaniciadi@users.providergatefvvk.app` (ör. `ahmet.yilmaz@users.providergatefvvk.app`)
- Şifre: en az 6 karakter
- Oluşan satırdaki **User UID** değerini kopyalayın.

Kullanıcı girişte sadece `ahmet.yilmaz` yazar. Gerçek e-posta ile açılan hesaplar e-postanın tamamıyla giriş yapar.

**2. Firestore Database → `users` koleksiyonu → Add document**
- Document ID: kopyaladığınız **UID**
- Alanlar:

| Alan | Tür | Çalışan örneği | Tedarikçi örneği |
|---|---|---|---|
| `username` | string | `ahmet.yilmaz` | `ted.ornek` |
| `displayName` | string | `Ahmet Yılmaz` | `Örnek Çekici Ltd.` |
| `userType` | string | `employee` | `supplier` |
| `roles` | array | `admin` (veya `operation`, `pricing`, `finance`, `manager`) | — |
| `supplierId` | string | — | `TED-001` |
| `active` | boolean | `true` | `true` |

## Yetkilendirme

Ayrıntılar: [docs/YETKILENDIRME.md](docs/YETKILENDIRME.md)
