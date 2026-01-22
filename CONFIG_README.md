# EnSQL Configuration Guide

## Config Dosyaları

Her projede (`admin`, `partner`, `client`, `web`) bir `config.js` dosyası bulunur. Bu dosyalar environment'a göre (development/production) otomatik olarak doğru URL'leri kullanır.

## URL Yapısı

### Development (localhost)

- **Kernel API:** http://localhost:13201/api
- **Admin Panel:** http://localhost:13205
- **Partner Panel:** http://localhost:13202
- **Client App:** http://localhost:13203

### Production

- **Kernel API:** https://kernel.ensql.com.tr/api
- **Admin Panel:** https://admin.ensql.com.tr
- **Partner Panel:** https://partner.ensql.com.tr
- **Client App:** https://app.ensql.com.tr

## Config Dosyası İçerikleri

### admin/src/config.js

```javascript
config.API_URL // Kernel API URL
config.PARTNER_URL // Partner Panel URL (admin -> partner geçişi)
config.CLIENT_URL // Client App URL (admin -> client geçişi)
```

### partner/src/config.js

```javascript
config.API_URL // Kernel API URL
config.CLIENT_URL // Client App URL (partner -> client geçişi)
```

### client/src/config.js

```javascript
config.API_URL // Kernel API URL
```

### web/src/config.js

```javascript
config.ADMIN_URL // Admin Panel URL
config.PARTNER_URL // Partner Panel URL
config.CLIENT_URL // Client App URL
```

## Kullanım Örnekleri

### API İstekleri

```javascript
import config from "../config"

// GET request
axios.get(`${config.API_URL}/customers`, {
  headers: { Authorization: `Bearer ${token}` },
})

// POST request
axios.post(`${config.API_URL}/partners`, data, {
  headers: { Authorization: `Bearer ${token}` },
})
```

### Panel Geçişleri

```javascript
import config from "../config"

// Admin -> Partner geçişi
window.open(`${config.PARTNER_URL}/auto-login?token=...`, "_blank")

// Partner -> Client geçişi
window.open(`${config.CLIENT_URL}/auto-login?token=...`, "_blank")
```

## Build İşlemi

Development modunda çalıştırırken:

```bash
npm run dev    # veya yarn dev
```

Production build için:

```bash
npm run build  # veya yarn build
```

Production build sırasında `import.meta.env.MODE === 'production'` olacağından, otomatik olarak production URL'leri kullanılır.

## Deployment

1. `distall.ps1` scriptini çalıştırarak tüm projeleri build edin:

   ```powershell
   .\distall.ps1
   ```

2. `dist` klasörü içindeki her proje kendi production URL'lerini içerir.

3. Build edilmiş dosyaları ilgili sunuculara deploy edin:
   - `dist/admin` → https://admin.ensql.com.tr
   - `dist/partner` → https://partner.ensql.com.tr
   - `dist/client` → https://app.ensql.com.tr
   - `dist/web` → Web sunucusu
   - `dist/kernel` → API sunucusu (yarn install ve start)

## Önemli Notlar

- Config dosyaları `.js` uzantılıdır (TypeScript değil), bu sayede tüm projelerde çalışır
- `import.meta.env.MODE` Vite tarafından otomatik sağlanır
- Development'ta değişiklik yaptığınızda sayfayı yenilemeye gerek yoktur (hot reload)
- Production build sonrası config değerleri statik olarak kod içine gömülür

## Yeni URL Ekleme

Eğer yeni bir URL eklemek isterseniz:

1. İlgili projenin `config.js` dosyasını açın
2. Yeni URL'i ekleyin:
   ```javascript
   NEW_SERVICE_URL: isDevelopment
     ? "http://localhost:PORT"
     : "https://service.ensql.com.tr"
   ```
3. Kodunuzda kullanın:
   ```javascript
   import config from "../config"
   axios.get(`${config.NEW_SERVICE_URL}/endpoint`)
   ```
