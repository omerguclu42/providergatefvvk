# ProviderGate FVVK

Asistans firması ile tedarikçileri arasında hizmet takibi, statü yönetimi,
fiyatlandırma ve faturalandırma portalı.

**İş akışı (hedef):** Hizmet atanır → tedarikçi statüleri ilerletir ve hizmeti
sonlandırır → dosya fiyatlanır → tedarikçi faturayı yükleyip gönderir → finans
kontrol edip onaylar. Her adım dosyayı yeni bir statüye taşır.

## Teknoloji

- React 18 + TypeScript + Vite
- Firebase Authentication (kullanıcı adı + şifre)
- Cloud Firestore
- Firebase Hosting

## Kurulum

```bash
npm install
cp .env.example .env.local   # Firebase web uygulaması değerlerini doldurun
npm run dev
```

## Firebase tarafında yapılacaklar

1. **Authentication → Sign-in method** bölümünde **Email/Password**'ü etkinleştirin.
2. **Firestore Database** oluşturun (bölge: `europe-west1` veya `eur3`).
3. **Proje ayarları → Web uygulaması ekle** adımından config değerlerini `.env.local`'a yazın.
4. Kuralları yayınlayın: `firebase deploy --only firestore:rules`

## İlk kurulum

1. Güvenlik kurallarını yayınlayın (Firestore → Rules → `firestore.rules` içeriğini yapıştırıp **Publish**).
2. Uygulamada `/kurulum` adresini açın (giriş sayfasında kurulum yapılmamışsa bağlantı çıkar).
3. İlk **Sistem Yöneticisi** hesabını oluşturun. Varsayılan roller otomatik eklenir.
4. **Yönetim** sayfasından tedarikçi firmaları ve kullanıcıları ekleyin.

Kurulum bir kez yapılır; sonrasında kurallar tekrarını engeller.

## Yetkilendirme

Ayrıntılar: [docs/YETKILENDIRME.md](docs/YETKILENDIRME.md)
