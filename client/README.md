# EnSQL Client

Kullanıcı rapor uygulaması. React, TypeScript, Tailwind CSS, PWA ve shadcn/ui kullanır.

## Kurulum

```bash
# Bağımlılıkları yükle (YARN kullan!)
yarn install

# .env dosyası oluştur
cp .env.example .env

# Development modunda çalıştır
yarn dev

# Build
yarn build

# Preview build
yarn preview
```

## Özellikler

- Rapor görüntüleme ve tasarlama
- SQL sorgu tasarımı ve çalıştırma
- Tarih filtreleri (başlangıç-bitiş)
- Arama/searchbox
- Ayarlar:
  - Connector bilgileri (clientId, clientPassword)
  - SQL Server bağlantı bilgileri
- PWA desteği (mobil ve offline çalışma)

## Teknolojiler

- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Vite
- React Router
- Axios
- Workbox (PWA)

## Port

Development: `http://localhost:3000`

## PWA Özelliği

Bu uygulama Progressive Web App (PWA) desteğine sahiptir:

- Offline çalışma
- Mobil cihaza yüklenebilir
- Push notification desteği (gelecekte)
