import { useState, type JSX } from 'react'
import { ChevronRight, BookOpen, Rocket, FileText, Code, Plug } from 'lucide-react'

export function Docs() {
  const [activeSection, setActiveSection] = useState('baslangic')

  const sections = [
    { id: 'baslangic', label: 'Başlangıç', icon: Rocket },
    { id: 'kurulum', label: 'Kurulum', icon: BookOpen },
    { id: 'raporlar', label: 'Raporlar', icon: FileText },
    { id: 'api', label: 'API Kullanımı', icon: Code },
    { id: 'erp', label: 'ERP Entegrasyonları', icon: Plug },
  ]

  const content: Record<string, { title: string; body: JSX.Element }> = {
    baslangic: {
      title: 'EnSQL\'e Hoş Geldiniz',
      body: (
        <div className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300">
            EnSQL, SQL Server, MySQL ve PostgreSQL veritabanlarınızdan raporlar oluşturmanıza ve
            bunlara her yerden erişmenize olanak tanıyan modern bir raporlama platformudur.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">Temel Özellikler</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Mobil, tablet ve masaüstü desteği</li>
            <li>SQL sorguları ile özel raporlar</li>
            <li>Port forwarding gerektirmez</li>
            <li>Tüm ERP sistemleriyle uyumlu</li>
            <li>Güvenli connector yapısı</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">Hızlı Başlangıç</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>EnSQL hesabı oluşturun</li>
            <li>Connector uygulamasını indirin ve kurun</li>
            <li>SQL Server bağlantı bilgilerinizi girin</li>
            <li>İlk raporunuzu oluşturun</li>
          </ol>
        </div>
      ),
    },
    kurulum: {
      title: 'Kurulum',
      body: (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">1. Connector Kurulumu</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Connector, veritabanınızla EnSQL arasında güvenli bağlantı kuran uygulamadır.
            Windows Server veya masaüstü bilgisayarınıza kurulur.
          </p>

          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <code className="text-sm text-gray-800 dark:text-gray-200">
              1. ensql-connector-setup.exe dosyasını indirin<br />
              2. Yönetici olarak çalıştırın<br />
              3. Kurulum sihirbazını takip edin<br />
              4. clientId ve clientPassword bilgilerinizi girin
            </code>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">2. SQL Server Ayarları</h3>
          <p className="text-gray-700 dark:text-gray-300">
            SQL Server'ınızın TCP/IP bağlantılarına izin verdiğinden emin olun.
          </p>

          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>SQL Server Configuration Manager'ı açın
              <p className="ms-6 font-bold">Version Path</p>
              <ul className="ms-6 list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li className="grid grid-cols-3 gap-4"><div>SQL Server 2025 (17.x)</div><div>C:\Windows\SysWOW64\SQLServerManager17.msc</div></li>
                <li className="grid grid-cols-3 gap-4"><div>SQL Server 2022 (16.x)</div><div>C:\Windows\SysWOW64\SQLServerManager16.msc</div></li>
                <li className="grid grid-cols-3 gap-4"><div>SQL Server 2019 (15.x)</div><div>C:\Windows\SysWOW64\SQLServerManager15.msc</div></li>
                <li className="grid grid-cols-3 gap-4"><div>SQL Server 2017 (14.x)</div><div>C:\Windows\SysWOW64\SQLServerManager14.msc</div></li>
                <li className="grid grid-cols-3 gap-4"><div>SQL Server 2016 (13.x)</div><div>C:\Windows\SysWOW64\SQLServerManager13.msc</div></li>
                <li className="grid grid-cols-3 gap-4"><div>SQL Server 2014 (12.x)</div><div>C:\Windows\SysWOW64\SQLServerManager12.msc</div></li>
                <li className="grid grid-cols-3 gap-4"><div>SQL Server 2012 (11.x)</div><div>C:\Windows\SysWOW64\SQLServerManager11.msc</div></li>
              </ul>
            </li>
            <li>TCP/IP protokolünü etkinleştirin</li>
            <li>SQL Server'ı yeniden başlatın</li>
          </ul>
          <img src="/public/img/sql-server-configuration-manager.png" alt="SQL Server Configuration Manager" className="rounded-lg border border-gray-300 dark:border-gray-700" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">3. İlk Bağlantı</h3>
          <p className="text-gray-700 dark:text-gray-300">
            EnSQL web veya mobil uygulamasından giriş yapın ve ayarlar bölümünden connector
            bilgilerinizi girin.
          </p>
        </div>
      ),
    },
    raporlar: {
      title: 'Raporlar',
      body: (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Rapor Oluşturma</h3>
          <p className="text-gray-700 dark:text-gray-300">
            EnSQL'de raporlar SQL sorguları ile oluşturulur. Her rapor için özel filtreler,
            simgeler ve başlıklar tanımlayabilirsiniz.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">Örnek SQL Sorgusu</h3>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <code className="text-sm text-gray-800 dark:text-gray-200">
              SELECT <br />
              &nbsp;&nbsp;TARIH,<br />
              &nbsp;&nbsp;MUSTERI_ADI,<br />
              &nbsp;&nbsp;TUTAR<br />
              FROM SATIS<br />
              WHERE TARIH BETWEEN @date1 AND @date2 AND MUSTERI_ADI like '%' + @search + '%'<br />
              ORDER BY TARIH DESC
            </code>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">Tarih Filtreleri</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Sorgularınızda @date1 ve @date2 parametrelerini kullanarak dinamik tarih
            filtreleri ekleyebilirsiniz.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">İkon Seçimi</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Her rapor için 70+ farklı simge arasından seçim yapabilirsiniz. Simgeler raporlarınızı
            daha kolay tanımlamanıza yardımcı olur.
          </p>
        </div>
      ),
    },
    api: {
      title: 'API Kullanımı',
      body: (
        <div className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300">
            EnSQL API'si ile kendi uygulamalarınızdan rapor verilerine erişebilirsiniz.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Authentication</h3>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <code className="text-sm text-gray-800 dark:text-gray-200">
              POST /api/auth/login<br />
              {'{'}<br />
              &nbsp;&nbsp;"username": "kullanici",<br />
              &nbsp;&nbsp;"password": "sifre"<br />
              {'}'}
            </code>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">Rapor Listesi</h3>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <code className="text-sm text-gray-800 dark:text-gray-200">
              GET /api/reports<br />
              Authorization: Bearer {'<token>'}
            </code>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">Rapor Verisi</h3>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <code className="text-sm text-gray-800 dark:text-gray-200">
              POST /api/reports/:id/execute<br />
              {'{'}<br />
              &nbsp;&nbsp;"startDate": "2024-01-01",<br />
              &nbsp;&nbsp;"endDate": "2024-12-31"<br />
              {'}'}
            </code>
          </div>
        </div>
      ),
    },
    erp: {
      title: 'ERP Entegrasyonları',
      body: (
        <div className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300">
            EnSQL, tüm SQL Server tabanlı ERP sistemleriyle uyumludur. Aşağıda popüler ERP
            sistemleri için örnek sorgular bulabilirsiniz.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Mikro ERP</h3>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <code className="text-sm text-gray-800 dark:text-gray-200">
              SELECT <br />
              &nbsp;&nbsp;sto.sto_kod,<br />
              &nbsp;&nbsp;sto.sto_isim,<br />
              &nbsp;&nbsp;SUM(sth.sth_miktar) as miktar<br />
              FROM STOKLAR sto<br />
              JOIN STOK_HAREKETLERI sth ON sto.sto_kod = sth.sth_stok_kod<br />
              WHERE sth.sth_tarih BETWEEN @date1 AND @date2<br />
              GROUP BY sto.sto_kod, sto.sto_isim
            </code>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">Logo</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Logo Tiger ve Go için tablo yapıları farklı olabilir. Firmanıza özel tablo yapısını
            kontrol edin.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">ETA, Netsis, Zirve</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Diğer ERP sistemleri için de benzer mantıkla sorgular oluşturabilirsiniz. Her sistemin
            tablo ve alan isimleri farklı olabilir.
          </p>

          <div className="p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl mt-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">💡 İpucu</h4>
            <p className="text-gray-700 dark:text-gray-300">
              ERP veritabanı yapınızdan emin değilseniz, önce SQL Server Management Studio ile
              tabloları inceleyin.
            </p>
          </div>
        </div>
      ),
    },
  }

  return (
    <div className="bg-white dark:bg-gray-900 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Dökümanlar
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            EnSQL'i kullanmaya başlamak için ihtiyacınız olan her şey
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1 sticky top-24">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${activeSection === section.id
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <section.icon className="w-5 h-5" />
                  <span>{section.label}</span>
                  {activeSection === section.id && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="prose prose-lg max-w-none dark:prose-invert bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {content[activeSection].title}
              </h2>
              {content[activeSection].body}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
