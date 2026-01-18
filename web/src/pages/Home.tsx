import { ArrowRight, Smartphone, Globe, Shield, Zap, Database, Cpu } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Home() {
  const features = [
    {
      icon: Smartphone,
      title: 'Her Cihazdan Erişim',
      description: 'Android, iPhone, Mac, Windows ve web üzerinden raporlarınıza her yerden ulaşın.'
    },
    {
      icon: Shield,
      title: 'Port Forwarding Yok',
      description: 'Connector yapısı sayesinde port açmaya gerek yok, güvenli ve kolay kurulum.'
    },
    {
      icon: Database,
      title: 'ERP Uyumluluğu',
      description: 'Mikro ERP, Logo, ETA, Netsis, Zirve ve tüm SQL Server veritabanlarıyla çalışır.'
    },
    {
      icon: Zap,
      title: 'Hızlı ve Kolay',
      description: 'Dakikalar içinde kurulum yapın, raporlarınızı tasarlayın ve paylaşın.'
    },
    {
      icon: Globe,
      title: 'Bulut Tabanlı',
      description: 'Verileriniz güvende, raporlarınız her zaman erişilebilir.'
    },
    {
      icon: Cpu,
      title: 'Güçlü Raporlama',
      description: 'SQL sorguları ile istediğiniz her raporu oluşturun, filtrelerin ve görselleştirin.'
    }
  ]

  const erpLogos = [
    { name: 'Mikro ERP', compatible: true },
    { name: 'Logo', compatible: true },
    { name: 'ETA', compatible: true },
    { name: 'Netsis', compatible: true },
    { name: 'Zirve', compatible: true },
  ]

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 dark:from-blue-950 to-indigo-100 dark:to-indigo-950 opacity-50" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Raporlarınıza{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 dark:from-blue-400 to-indigo-600 dark:to-indigo-400">
                Her Yerden
              </span>{' '}
              Erişin
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              EnSQL ile mobil, tablet ve masaüstü cihazlarınızdan raporlarınızı görüntüleyin.
              Kolay kurulum, güçlü raporlama, güvenli erişim.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/downloads"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors"
              >
                Hemen İndirin
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a
                href="http://localhost:13203/login"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Demo'yu Deneyin
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Neden EnSQL?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Modern raporlama ihtiyaçlarınız için tasarlanmış, kullanımı kolay ve güçlü özellikler.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-blue-500 dark:from-blue-600 to-indigo-600 dark:to-indigo-700">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ERP Compatibility Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Tüm ERP Sistemleriyle Uyumlu
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              SQL Server kullanan tüm ERP sistemleriyle çalışır. Ayrıca MySQL ve PostgreSQL desteği.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 items-center">
            {erpLogos.map((erp, index) => (
              <div
                key={index}
                className="px-8 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {erp.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 dark:from-blue-700 to-indigo-700 dark:to-indigo-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Hemen Başlayın
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            EnSQL'i indirin ve dakikalar içinde raporlarınıza her yerden erişmeye başlayın.
          </p>
          <Link
            to="/downloads"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            İndir
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
