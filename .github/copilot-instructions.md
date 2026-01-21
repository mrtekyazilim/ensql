# EnSQL - Connector Rapor Uygulaması

## Proje Genel Bakış

EnSQL, connector uygulaması üzerinden müşterilere özel raporlar sağlayan bir sistemdir. **3-tier mimari** ile çalışır: Admin → Partner → Customer hiyerarşisi. Kullanıcılar hem mobil (cep telefonu) hem de PC/web üzerinden raporlarına erişebilir.

## Mimari Yapı (3-Tier Hierarchy)

```
Admin Panel (port:13205)
    ↓
Partner Panel (port:13202)
    ↓
Customer App (port:13203)
```

- **Admin:** Tüm sistemi yönetir, partnerleri oluşturur/yönetir
- **Partner:** Kendi müşterilerini yönetir, raporlar oluşturur
- **Customer:** Kendi raporlarını görüntüler

## Proje Yapısı

### kernel/ - Backend API Servisi

- **Teknolojiler:** Node.js, Express.js, MongoDB
- **Paket Yöneticisi:** Yarn (npm kullanma!)
- **Mimari:** RESTful API servisi
- **Port:** 13201

**Authentication Yapısı:**

- **Admin Authentication:** Kullanıcı adı ve şifre ile giriş (admin panel için)
- **Partner Authentication:** partnerCode + username + password (partner panel için)
  - **partnerCode Format:** `/^[a-z0-9-]+$/` (sadece lowercase, rakam, tire)
  - **ÖNEMLİ:** Partner `password` alanı hash'lenir, ancak `clientPassword` plain text
- **Customer Authentication:** partnerCode + username + password (customer uygulaması için)
  - Customer'lar partnerlara bağlıdır (partnerId foreign key)
- **Connector Authentication:** clientId ve clientPassword (connector bağlantısı için)
  - **ÖNEMLİ:** Connector `clientPassword` alanı **plain text** olarak database'de saklanır (hash'lenmez)
  - Karşılaştırma işlemi düz string equality ile yapılır
  - Güvenlik: Connector sadece ilgili müşteriye ait verilere erişebilir

**Özellikler:**

- Partner yönetimi (CRUD, soft-delete, reactivation)
- Customer yönetimi (partnerlara bağlı)
- Kullanıcı yönetimi ve hizmet bitiş tarihleri
- SQL sorgu yönetimi
- Rapor veri servisi
- Connector bağlantı yönetimi
- Activity logging (partner deactivation, customer session closures)
- **ConnectorAbi Proxy:** Client tarafından ConnectorAbi'ye doğrudan erişim yerine, kernel üzerinden proxy edilir

**Database Modelleri:**

- **AdminUser:** Admin panel kullanıcıları (role: admin)
- **AdminSession:** Admin oturum takibi
- **Partner:** Partner bilgileri (partnerCode unique, soft-delete destekli)
- **PartnerSession:** Partner oturum takibi
- **Customer:** Müşteri bilgileri (partnerId ile bağlantılı, compound unique: partnerId+username)
- **CustomerSession:** Müşteri oturum takibi
- **Connector:** SQL Server bağlantı bilgileri
- **Report:** Rapor tanımları
- **Activity:** Sistem aktivite logları

**API Endpoints:**

- `/api/auth/admin/login` - Admin girişi
- `/api/auth/partner/login` - Partner girişi (partnerCode + username + password)
- `/api/auth/client/login` - Customer girişi (partnerCode + username + password)
- `/api/auth/admin-login-as-partner/:partnerId` - Admin olarak partner paneline geçiş
- `/api/auth/partner-login-as-customer/:customerId` - Partner olarak customer uygulamasına geçiş
- `/api/partners` - Partner CRUD (admin only)
- `/api/partners/:id/customers` - Partner müşteri listesi
- `/api/partners/:id/activate` - Partner aktifleştir (partnerCode onayı ile)
- `/api/customers` - Customer CRUD (partner filtered)
- `/api/connector-proxy/*` - ConnectorAbi proxy endpoints

**ConnectorAbi Entegrasyonu:**

- **Base URL:** https://kernel.connectorabi.com/api/v1
- **Authentication:** clientId ve clientPass (hem header hem body'de)
- **Endpoints:**
  - `/datetime` - Connector bağlantı testi
  - `/mssql` - SQL Server sorgu çalıştırma
- **Veri Formatı:**

  ```json
  // Request
  {
    "clientId": "...",
    "clientPass": "...",
    "config": {
      "user": "sa",
      "password": "...",
      "database": "...",
      "server": "localhost",
      "port": 1433,
      "dialect": "mssql",
      "dialectOptions": { "instanceName": "" },
      "options": { "encrypt": false, "trustServerCertificate": true }
    },
    "query": "SELECT * FROM ..."
  }

  // Response (mssql endpoint)
  {
    "data": {
      "recordsets": [
        [
          { "Column1": "value1", "Column2": "value2" }
        ]
      ]
    }
  }
  ```

- **Veri Erişimi:**
  - Backend proxy'den: `response.data.data.data.recordsets[0]` (çünkü backend `{ success: true, data: connectorResponse }` döner)
  - Direct ConnectorAbi'den: `response.data.data.recordsets[0]`
- **Timeout:** datetime için 10000ms, mssql için 15000ms
- **Client Kullanımı:** Client app'ler ConnectorAbi'ye doğrudan değil, `http://localhost:13201/api/connector-proxy/*` üzerinden erişir
- **Backend Endpoints:**
  - `/api/connector-proxy/datetime` - Connector bağlantı testi
  - `/api/connector-proxy/mssql` - SQL Server sorgu çalıştırma (config body'de veya connector'dan)
  - `/api/connector-proxy/mysql` - MySQL sorgu çalıştırma
  - `/api/connector-proxy/pg` - PostgreSQL sorgu çalıştırma

### admin/ - Admin Panel Uygulaması

- **Teknolojiler:** React.js, TypeScript, Tailwind CSS, shadcn
- **Amaç:** Sistem ve partner yönetimi
- **Port:** 13205
- **Backend API URL:** http://localhost:13201/api
- **Partner Panel URL:** http://localhost:13202
- **localStorage Keys:** adminToken, adminUser, admin-deviceId
- **Theme Key:** ensql-admin-theme

**Özellikler:**

- Partner tanımlama ve yönetimi (Partners.tsx)
- Partner CRUD (partnerCode, partnerName, hizmetBitisTarihi)
- Partner customer count ve detail modal
- Partner aktifleştir/pasifleştir (soft-delete)
- "Bağlan" butonu → Partner paneline admin olarak erişim
- Admin kullanıcı yönetimi (AdminUsers.tsx)
- Activity ve session tracking

### partner/ - Partner Panel Uygulaması

- **Teknolojiler:** React.js, TypeScript, Tailwind CSS, shadcn
- **Amaç:** Partner seviyesinde müşteri ve rapor yönetimi
- **Port:** 13202
- **Backend API URL:** http://localhost:13201/api
- **Client URL:** http://localhost:13203
- **localStorage Keys:** partnerToken, partnerUser, partner-deviceId
- **Theme Key:** ensql-partner-theme

**Özellikler:**

- Müşteri tanımlama ve yönetimi (partnerId ile filtrelenmiş)
- Müşteri hizmet bitiş tarihleri
- Müşteri kullanım istatistikleri
- "Bağlan" butonu → Client projesine partner olarak erişim
- SQL sorgu tasarlama ve yönetimi
- Dashboard (partner bazlı istatistikler)

### client/ - Kullanıcı Rapor Uygulaması

- **Teknolojiler:** React.js, TypeScript, Tailwind CSS, PWA, shadcn
- **Amaç:** Kullanıcıların raporlarını görüntülemesi
- **Port:** 13203
- **localStorage Keys:** clientToken, clientUser, client-deviceId (veya deviceId)
- **Theme Key:** ensql-client-theme

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

### Frontend (admin/, partner/ ve client/)

- TypeScript strict mode kullan
- Tailwind CSS için utility-first yaklaşımı
- shadcn/ui component library kullan
- React hooks ve functional components
- PWA için service worker ve manifest (client/)
- Responsive tasarım (mobile-first)
- **Dark/Light Mode:** Her üç projede de dark mode desteği (localStorage ile kalıcı)
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
