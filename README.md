# EnSQL Projesi

EnSQL, connector uygulaması üzerinden müşterilere özel raporlar sağlayan bir sistemdir.

## Proje Yapısı

```
ensql/
├── kernel/          # Backend API (Node.js, Express, MongoDB)
├── adminpanel/      # Admin Panel (React, TypeScript, Tailwind)
├── client/          # Kullanıcı Uygulaması (React, TypeScript, Tailwind, PWA)
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
yarn dev

# Admin Panel
cd adminpanel
yarn install
cp .env.example .env
yarn dev

# Client (Kullanıcı Uygulaması)
cd client
yarn install
cp .env.example .env
yarn dev
```

## Portlar

- **Backend (kernel):** `http://localhost:13201`
- **Admin Panel:** `http://localhost:13202`
- **Client:** `http://localhost:13203`

## Önemli Notlar

- **Paket yöneticisi:** YARN kullanın (npm değil!)
- Her proje bağımsız çalışır
- Backend'i önce başlatın, ardından frontend uygulamaları

## Teknolojiler

### Backend (kernel)

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication

### Frontend (adminpanel & client)

- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Vite

### Ek Özellikler

- PWA desteği (client)
- Responsive tasarım
- REST API

## Dokümantasyon

Her proje klasöründe detaylı README.md dosyası bulunmaktadır.
