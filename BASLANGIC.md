# EnSQL Projesini Başlatma Rehberi

## 1. MongoDB Kurulumu ve Başlatma

MongoDB'nin kurulu ve çalışır durumda olduğundan emin olun.

```bash
# MongoDB'yi başlatın (Windows)
net start MongoDB

# veya mongod komutu ile
mongod --dbpath C:\data\db
```

## 2. Backend (kernel) Başlatma

```bash
# kernel klasörüne gidin
cd kernel

# Örnek verileri oluşturun (ilk seferinde)
yarn seed

# Backend'i başlatın
yarn dev
```

Backend `http://localhost:13201` adresinde çalışacak.

### Seed Script ile Oluşturulan Hesaplar

**Admin Hesabı:**

- Kullanıcı Adı: `admin`
- Şifre: `admin123`
- URL: http://localhost:13205

**Demo Partner Hesabı:**

- Partner Kodu: `demo-partner`
- Kullanıcı Adı: `demo`
- Şifre: `demo123`
- URL: http://localhost:13202

**Demo Customer Hesabı:**

- Partner Kodu: `demo-partner`
- Kullanıcı Adı: `test`
- Şifre: `test123`
- URL: http://localhost:13203

## 3. Admin Panel Başlatma

Yeni bir terminal penceresi açın:

```bash
# admin klasörüne gidin
cd admin

# Development modunda başlatın
yarn dev
```

Admin Panel `http://localhost:13205` adresinde çalışacak.

## 4. Partner Panel Başlatma

Yeni bir terminal penceresi açın:

```bash
# partner klasörüne gidin
cd partner

# Development modunda başlatın
yarn dev
```

Partner Panel `http://localhost:13202` adresinde çalışacak.

## 5. Client Uygulaması Başlatma

Yeni bir terminal penceresi açın:

```bash
# client klasörüne gidin
cd client

# Development modunda başlatın
yarn dev
```

Client Uygulaması `http://localhost:13203` adresinde çalışacak.

## 6. Test Etme - 3-Tier Architecture

### Admin Panel Testi

1. Admin Panel'e giriş yapın: `http://localhost:13205`
   - Kullanıcı Adı: `admin`
   - Şifre: `admin123`

2. "Partnerler" sayfasına gidin
   - Demo partner'ı görebilirsiniz: `demo-partner`
   - "Bağlan" butonuna tıklayarak partner paneline geçiş yapabilirsiniz

3. Yeni partner oluşturmak için:
   - "Yeni Partner" butonuna tıklayın
   - Partner kodu: `test-partner` (küçük harf, rakam, tire)
   - Partner ismi: Test Partner A.Ş.
   - İlk kullanıcı adı: admin
   - Şifre: admin123
   - Hizmet Bitiş Tarihi: Gelecek bir tarih

### Partner Panel Testi

1. Partner Panel'e giriş yapın: `http://localhost:13202`
   - Partner Kodu: `demo-partner`
   - Kullanıcı Adı: `demo`
   - Şifre: `demo123`

2. "Müşteriler" sayfasına gidin
   - Demo müşteriyi görebilirsiniz: `test`
   - "Bağlan" butonuna tıklayarak customer uygulamasına geçiş yapabilirsiniz

3. Yeni müşteri oluşturmak için:
   - "Yeni Müşteri" butonuna tıklayın
   - Kullanıcı bilgilerini doldurun
   - Hizmet bitiş tarihi seçin

### Customer App Testi

1. Client Uygulamasına gidin: `http://localhost:13203`
   - Partner Kodu: `demo-partner`
   - Kullanıcı Adı: `test`
   - Şifre: `test123`

2. Raporlarınızı görüntüleyin
3. Ayarlar sayfasından connector bilgilerini yapılandırın

## Çalışma Portları

- **Backend API:** http://localhost:13201
- **Admin Panel:** http://localhost:13205
- **Partner Panel:** http://localhost:13202
- **Client App:** http://localhost:13203

## Önemli Notlar

- MongoDB'nin çalışır durumda olması gerekir
- Backend'i diğer uygulamalardan önce başlatın
- Tüm bağımlılıklar yarn ile yüklenmiştir
- .env dosyaları oluşturulmuş ve yapılandırılmıştır

## Sorun Giderme

### MongoDB bağlantı hatası

- MongoDB'nin çalıştığından emin olun
- .env dosyasındaki MONGODB_URI'yi kontrol edin

### Port çakışması

- Belirtilen portların başka uygulamalar tarafından kullanılmadığından emin olun
- Gerekirse .env dosyalarından portları değiştirin

### CORS hatası

- Backend'in çalıştığından emin olun
- Backend CORS ayarları tüm origin'lere izin verir (development için)

## API Dokümantasyonu

### Authentication Endpoints

- `POST /api/auth/admin/login` - Admin girişi (username + password)
- `POST /api/auth/partner/login` - Partner girişi (partnerCode + username + password)
- `POST /api/auth/client/login` - Customer girişi (partnerCode + username + password)
- `POST /api/auth/admin-login-as-partner/:partnerId` - Admin→Partner geçişi
- `POST /api/auth/partner-login-as-customer/:customerId` - Partner→Customer geçişi
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### Partner Endpoints (Admin only)

- `GET /api/partners` - Tüm partnerler (customer count ile)
- `POST /api/partners` - Yeni partner oluştur (partnerCode, partnerName, username, password)
- `GET /api/partners/:id` - Partner detayı
- `GET /api/partners/:id/customers` - Partner müşteri listesi
- `PUT /api/partners/:id` - Partner güncelle (aktif=false → customer sessions close)
- `PUT /api/partners/:id/activate` - Partner aktifleştir (partnerCode onayı)

### Customer Endpoints (Partner filtered)

- `GET /api/customers` - Müşteri listesi (partner bazlı filtreleme)
- `POST /api/customers` - Yeni müşteri oluştur (partnerId otomatik)
- `GET /api/customers/:id` - Müşteri detayı
- `PUT /api/customers/:id` - Müşteri güncelle
- `DELETE /api/customers/:id` - Müşteri sil

### Report Endpoints

- `GET /api/reports` - Raporlar listesi
- `POST /api/reports` - Yeni rapor oluştur
- `GET /api/reports/:id` - Rapor detayı
- `PUT /api/reports/:id` - Rapor güncelle
- `DELETE /api/reports/:id` - Rapor sil
- `POST /api/reports/:id/execute` - Rapor çalıştır

### Connector Endpoints

- `POST /api/connector/auth` - Connector authentication
- `POST /api/connector/query` - Sorgu çalıştır
- `POST /api/connector/reports` - Rapor listesi
- `POST /api/connector/test-connection` - SQL Server bağlantı testi

## Geliştirme İpuçları

1. **Hot Reload:** Tüm projeler nodemon/vite ile hot reload desteğine sahiptir
2. **Debugging:** VS Code'da debug yapılandırmaları eklenebilir
3. **Linting:** ESLint yapılandırılmıştır, `yarn lint` ile kontrol edilebilir
4. **TypeScript:** Frontend projeleri TypeScript kullanır, tip hatalarına dikkat edin

## Sonraki Adımlar

- SQL Server bağlantı implementasyonu (mssql paketi ile)
- Rapor çalıştırma fonksiyonunu tamamlama
- Daha fazla UI component'i ekleme (shadcn/ui)
- PWA özelliklerini aktifleştirme
- Test yazma (Jest, React Testing Library)
