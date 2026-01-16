# EnSQL - Connector Rapor Uygulaması

## Proje Genel Bakış

EnSQL, connector uygulaması üzerinden müşterilere özel raporlar sağlayan bir sistemdir. Kullanıcılar hem mobil (cep telefonu) hem de PC/web üzerinden raporlarına erişebilir.

## Proje Yapısı

### kernel/ - Backend API Servisi

- **Teknolojiler:** Node.js, Express.js, MongoDB
- **Paket Yöneticisi:** Yarn (npm kullanma!)
- **Mimari:** RESTful API servisi
- **Port:** 13201

**Authentication Yapısı:**

- **Admin Authentication:** Kullanıcı adı ve şifre ile giriş (adminpanel için)
- **Client Authentication:** Kullanıcı adı ve şifre ile giriş (client uygulaması için)
- **Connector Authentication:** clientId ve clientPassword (müşteri connector bağlantısı için)

**Özellikler:**

- Kullanıcı yönetimi ve hizmet bitiş tarihleri
- SQL sorgu yönetimi
- Rapor veri servisi
- Connector bağlantı yönetimi

### adminpanel/ - Admin Panel Uygulaması

- **Teknolojiler:** React.js, TypeScript, Tailwind CSS, shadcn
- **Amaç:** Sistem yönetimi ve kullanıcı yönetimi
- **Port:** 13202
- **Backend API URL:** http://localhost:13201/api
- **Client URL:** http://localhost:13203

**Özellikler:**

- Kullanıcı tanımlama ve yönetimi
- Kullanıcı hizmet bitiş tarihleri
- Kullanıcı kullanım istatistikleri (ne kadar kullandığı)
- Kullanıcı listesinde "Bağlan" butonu → Client projesine admin olarak erişim
- SQL sorgu tasarlama ve yönetimi

### client/ - Kullanıcı Rapor Uygulaması

- **Teknolojiler:** React.js, TypeScript, Tailwind CSS, PWA, shadcn
- **Amaç:** Kullanıcıların raporlarını görüntülemesi
- **Port:** 13203

**Özellikler:**

- Rapor tasarlama ve görüntüleme
- SQL sorgu tasarımı ve çalıştırma
- Tarih filtreleri (başlangıç-bitiş tarihleri)
- Arama/searchbox özelliği
- Ayarlar bölümü:
  - Connector bilgileri (clientId, clientPassword)
  - SQL Server bağlantı bilgileri

## Geliştirme Standartları

### Backend (kernel/)

- Yarn kullan (npm değil)
- Express.js middleware yapısı kullan
- MongoDB için Mongoose ODM kullan
- RESTful API prensiplerine uy
- Environment variables için .env kullan
- Error handling middleware'leri ekle

### Frontend (adminpanel/ ve client/)

- TypeScript strict mode kullan
- Tailwind CSS için utility-first yaklaşımı
- shadcn/ui component library kullan
- React hooks ve functional components
- PWA için service worker ve manifest (client/)
- Responsive tasarım (mobile-first)
- **Dark/Light Mode:** Her iki projede de dark mode desteği (localStorage ile kalıcı)

#### Dark Mode Kuralları (ÖNEMLİ!)

**Her yeni component, page, modal veya UI elementi oluştururken MUTLAKA dark mode sınıflarını ekle:**

- **Arka Planlar:** `bg-white dark:bg-gray-800`, `bg-gray-50 dark:bg-gray-900`
- **Metinler:** `text-gray-900 dark:text-white`, `text-gray-600 dark:text-gray-400`
- **Kenarlıklar:** `border-gray-300 dark:border-gray-600`, `border-gray-200 dark:border-gray-700`
- **Input Alanları:** `bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600`
- **Placeholder:** `placeholder-gray-500 dark:placeholder-gray-400`
- **Modal/Dialog:** `bg-white dark:bg-gray-800` (içerik), `bg-gray-50 dark:bg-gray-700` (footer)
- **Kartlar:** Gradient kullanırken dark: versiyonlarını ekle: `from-blue-500 dark:from-blue-600`
- **Hover Durumları:** `hover:bg-gray-100 dark:hover:bg-gray-700`

**Default Theme:** App.tsx'de `defaultTheme="dark"` olarak ayarlanmıştır.

**Test Kontrol Listesi:**

- [ ] Yeni component/page oluşturulduğunda dark mode'da test et
- [ ] Beyaz arka plan görüyorsan `dark:bg-gray-800/900` ekle
- [ ] Siyah metin görünmüyorsa `dark:text-white` ekle
- [ ] Modal/Dialog açılırken içerik ve footer'ı kontrol et
- [ ] Input alanları placeholder ve border renklerini kontrol et

### Kod Standartları

- Türkçe yorum ve değişken isimleri kullanılabilir
- Anlamlı değişken ve fonksiyon isimleri
- DRY (Don't Repeat Yourself) prensibi
- Moduler ve yeniden kullanılabilir kod yapısı

## Önemli Notlar

- Her proje kendi bağımlılıklarını yönetir
- API endpoint'leri RESTful standartlarda olmalı
- Authentication ve authorization güvenliği önemli
- SQL injection önlemleri alınmalı
- Kullanıcı deneyimi (UX) öncelikli tasarım
