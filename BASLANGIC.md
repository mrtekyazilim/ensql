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

# Admin kullanıcısı oluşturun (ilk seferinde)
yarn seed

# Backend'i başlatın
yarn dev
```

Backend `http://localhost:13201` adresinde çalışacak.

### Admin Kullanıcı Bilgileri

- **Kullanıcı Adı:** admin
- **Şifre:** admin123

## 3. Admin Panel Başlatma

Yeni bir terminal penceresi açın:

```bash
# adminpanel klasörüne gidin
cd adminpanel

# Development modunda başlatın
yarn dev
```

Admin Panel `http://localhost:13202` adresinde çalışacak.

## 4. Client Uygulaması Başlatma

Yeni bir terminal penceresi açın:

```bash
# client klasörüne gidin
cd client

# Development modunda başlatın
yarn dev
```

Client Uygulaması `http://localhost:13203` adresinde çalışacak.

## 5. İlk Kullanıcı Oluşturma

1. Admin Panel'e giriş yapın: `http://localhost:13202`

   - Kullanıcı Adı: admin
   - Şifre: admin123

2. "Kullanıcılar" sayfasına gidin

3. "Yeni Kullanıcı" butonuna tıklayın

4. Kullanıcı bilgilerini doldurun:

   - Kullanıcı Adı: test
   - Şifre: test123
   - Client ID: test-client-1
   - Client Password: test-connector-123
   - Hizmet Bitiş Tarihi: Gelecek bir tarih seçin

5. "Oluştur" butonuna tıklayın

## 6. Client Uygulamasında Giriş Yapma

1. Client Uygulamasına gidin: `http://localhost:13203`

2. Oluşturduğunuz kullanıcı bilgileriyle giriş yapın:

   - Kullanıcı Adı: test
   - Şifre: test123

3. Ayarlar sayfasından SQL Server bağlantı bilgilerini girin

## Çalışma Portları

- **Backend API:** http://localhost:13201
- **Admin Panel:** http://localhost:13202
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

- `POST /api/auth/admin/login` - Admin girişi
- `POST /api/auth/client/login` - Client girişi
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### User Endpoints (Admin only)

- `GET /api/users` - Tüm kullanıcılar
- `POST /api/users` - Yeni kullanıcı oluştur
- `GET /api/users/:id` - Kullanıcı detayı
- `PUT /api/users/:id` - Kullanıcı güncelle
- `DELETE /api/users/:id` - Kullanıcı sil

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
