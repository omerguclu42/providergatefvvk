# Yetkilendirme Tasarımı

## 1. İki ana kullanıcı tipi

| | Tedarikçi (`supplier`) | Şirket çalışanı (`employee`) |
|---|---|---|
| Giriş sonrası | `tedarikci.html` | `panel.html` |
| Gördüğü veri | Yalnızca kendi firmasına (`supplierId`) atanan dosyalar | Rolüne göre |
| Yetki kaynağı | Sabit tedarikçi seti | Atanan rollerin birleşimi |

Tedarikçi, çalışan sayfasının adresini yazsa bile `yetkisiz.html` sayfasına yönlenir.

## 2. Görme ve işlem yetkisi ayrı

Yetkiler `modül.eylem` biçimindedir:
- `*.view` → sayfayı ve menü öğesini görür
- `*.edit`, `*.approve`, `*.upload`, `*.updateStatus` … → ilgili butonu kullanır

Örnek: `invoices.view` yetkisi olan ama `invoices.approve` yetkisi olmayan kişi faturayı görür, onay butonunu görmez.

Tam liste: `js/permissions.js`.

## 3. Roller (şirket çalışanları)

| Rol ID | Ad | Özet |
|---|---|---|
| `operation` | Operasyon | Dosya açar, tedarikçiye atar, statü ilerletir |
| `pricing` | Fiyatlandırma | Fiyat girer ve onaylar |
| `finance` | Finans / Muhasebe | Faturayı onaylar veya reddeder, rapor görür |
| `manager` | Yönetici | Her şeyi görür, işlem yapmaz |
| `admin` | Sistem Yöneticisi | Tüm yetkiler |

Bir kişiye birden fazla rol verilebilir, yetkiler birleşir. Kişiye özel ek yetki için
profile `extraPermissions` (array) alanı eklenebilir.

## 4. Sayfalarda kullanım

```html
<!-- Yetki yoksa bu öğe sayfadan kaldırılır -->
<button data-permission="invoices.approve">Onayla</button>
```

```js
import { requireAuth } from "./js/auth.js";
const { can } = await requireAuth({ userType: "employee", permission: "invoices.view" });
if (can("services.close")) { /* ... */ }
```

## 5. Güvenlik

Butonları gizlemek tek başına güvenlik değildir. Asıl koruma `firestore.rules` içindedir.
Hizmet dosyaları ve faturalar eklendikçe kurallar da "kim neyi okuyup yazabilir" şeklinde genişletilecek.
