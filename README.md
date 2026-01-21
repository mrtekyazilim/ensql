# EnSQL Projesi

EnSQL, connector uygulaması üzerinden müşterilere özel raporlar sağlayan bir sistemdir. **3-tier mimari** ile çalışır: Admin → Partner → Customer hiyerarşisi.

## Mimari Yapı

```
Admin (port:13205)
    ↓
Partner (port:13202)
    ↓
Customer (port:13203)
```

- **Admin:** Tüm sistemi yönetir, partnerleri oluşturur
- **Partner:** Kendi müşterilerini yönetir, raporlar oluşturur
- **Customer:** Kendi raporlarını görüntüler

## Proje Yapısı

```
ensql/
├── kernel/          # Backend API (Node.js, Express, MongoDB)
├── admin/           # Admin Panel (React, TypeScript, Tailwind) - port:13205
├── partner/         # Partner Panel (React, TypeScript, Tailwind) - port:13202
├── client/          # Customer App (React, TypeScript, Tailwind, PWA) - port:13203
└── .github/         # GitHub ve Copilot ayarları
```

## Kurulum

Her proje klasöründe bağımlılıkları yüklemek için:

```bash
# Kernel (Backend)
cd kernel
yarn install
cp .env.example .env
# .env dosyasını düzenleyin

# Seed script ile örnek verileri oluştur
yarn seed

# Backend'i başlat
yarn dev

# Admin Panel
cd admin
yarn install
yarn dev

# Partner Panel
cd partner
yarn install
yarn dev

# Client (Customer App)
cd client
yarn install
yarn dev
```

## Seed Script Hesapları

Seed script (`yarn seed`) aşağıdaki hesapları oluşturur:

**Admin:** admin / admin123 (http://localhost:13205)  
**Partner:** demo-partner + demo / demo123 (http://localhost:13202)  
**Customer:** demo-partner + test / test123 (http://localhost:13203)

## Portlar

- **Backend (kernel):** `http://localhost:13201`
- **Admin Panel:** `http://localhost:13205`
- **Partner Panel:** `http://localhost:13202`
- **Client (Customer):** `http://localhost:13203`

## Önemli Notlar

- **Paket yöneticisi:** YARN kullanın (npm değil!)
- Her proje bağımsız çalışır
- Backend'i önce başlatın, ardından frontend uygulamaları

## Teknolojiler

### Backend (kernel)

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication (role-based: admin/partner/customer)
- 3-tier Architecture

### Frontend (admin, partner, client)

- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Vite
- Dark/Light Mode

### Ek Özellikler

- PWA desteği (client)
- Responsive tasarım
- REST API
- Partner soft-delete ve reactivation
- Auto-session cleanup
- ConnectorAbi proxy

## Authentication

- **Admin:** username + password
- **Partner:** partnerCode + username + password
- **Customer:** partnerCode + username + password

partnerCode format: `/^[a-z0-9-]+$/` (lowercase, numbers, hyphens only)

## Dokümantasyon

Her proje klasöründe detaylı README.md dosyası bulunmaktadır.
