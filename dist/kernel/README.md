# EnSQL Kernel - Backend API

Backend API servisi. Node.js, Express.js ve MongoDB kullanır.

## Kurulum

```bash
# Bağımlılıkları yükle (YARN kullan!)
yarn install

# .env dosyası oluştur
cp .env.example .env

# MongoDB bağlantı bilgilerini düzenle

# Development modunda çalıştır
yarn dev

# Production modunda çalıştır
yarn start
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Admin/Client login (username, password)
- `POST /api/auth/register` - Yeni kullanıcı kaydı (admin only)

### Connector

- `POST /api/connector/auth` - Connector authentication (clientId, clientPassword)
- `POST /api/connector/query` - SQL sorgu çalıştır

### Users

- `GET /api/users` - Tüm kullanıcılar (admin only)
- `GET /api/users/:id` - Kullanıcı detayı
- `PUT /api/users/:id` - Kullanıcı güncelle
- `DELETE /api/users/:id` - Kullanıcı sil (admin only)

### Reports

- `GET /api/reports` - Kullanıcının raporları
- `POST /api/reports` - Yeni rapor oluştur
- `PUT /api/reports/:id` - Rapor güncelle
- `DELETE /api/reports/:id` - Rapor sil
- `POST /api/reports/:id/execute` - Rapor çalıştır

## Veritabanı Modelleri

### User

- username, password (authentication için)
- role (admin/client)
- clientId, clientPassword (connector için)
- hizmetBitisTarihi
- sqlServerConfig
- kullanimIstatistikleri

### Report

- raporAdi, aciklama
- sqlSorgusu
- parametreler
- goruntuAyarlari
- kullanimSayisi
