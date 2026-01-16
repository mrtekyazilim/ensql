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

**ZORUNLU Dark Mode Class'ları:**

- **Arka Planlar:**
  - Sayfa/Container: `bg-white dark:bg-gray-800`
  - İkincil alan: `bg-gray-50 dark:bg-gray-900`
  - Hover: `hover:bg-gray-100 dark:hover:bg-gray-700`
- **Metinler:**
  - Ana başlık: `text-gray-900 dark:text-white`
  - Alt başlık/açıklama: `text-gray-600 dark:text-gray-400`
  - Disabled/pasif: `text-gray-500 dark:text-gray-400`
- **Kenarlıklar:**
  - Normal: `border-gray-300 dark:border-gray-600`
  - İnce: `border-gray-200 dark:border-gray-700`
  - Ayraç: `divide-gray-200 dark:divide-gray-700`
- **Input Alanları (TÜM input, textarea, select):**
  - `bg-white dark:bg-gray-700`
  - `text-gray-900 dark:text-white`
  - `border-gray-300 dark:border-gray-600`
  - `placeholder-gray-500 dark:placeholder-gray-400`
  - Label: `text-gray-700 dark:text-gray-300`
- **Modal/Dialog:**
  - İçerik: `bg-white dark:bg-gray-800`
  - Overlay: `bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80`
  - Footer: `bg-gray-50 dark:bg-gray-700`
- **Kartlar/Listeler:**
  - Kart: `bg-white dark:bg-gray-800`
  - Liste öğesi hover: `hover:bg-gray-50 dark:hover:bg-gray-700`
  - Gradient: `from-blue-500 dark:from-blue-600 to-indigo-700 dark:to-indigo-950`
- **Butonlar:**
  - Outline: `bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600`
  - Primary: `bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600`
- **Linkler:**
  - `text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300`

**Default Theme:** App.tsx'de `defaultTheme="dark"` olarak ayarlanmıştır.

**UYARI:** Yeni bir component/page/modal oluştururken dark mode class'larını UNUTMA! Her beyaz arka plan dark:bg-gray-800, her siyah metin dark:text-white olmalı!

**Test Kontrol Listesi:**

- [ ] Yeni component/page oluşturulduğunda dark mode'da test et
- [ ] Beyaz arka plan görüyorsan `dark:bg-gray-800/900` ekle
- [ ] Siyah metin görünmüyorsa `dark:text-white` ekle
- [ ] Modal/Dialog açılırken içerik ve footer'ı kontrol et
- [ ] Input alanları placeholder ve border renklerini kontrol et
- [ ] Liste hover durumları düzgün çalışıyor mu kontrol et
- [ ] Gradient renkler dark mode'da görünüyor mu kontrol et

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
