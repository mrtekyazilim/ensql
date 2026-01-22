import { Check } from 'lucide-react'

export function Pricing() {
  const plans = [
    {
      name: 'Temel',
      price: '490',
      period: 'yıl',
      description: 'Küçük işletmeler için ideal',
      features: [
        '3 Dashboard Raporu',
        '5 Normal Rapor',
        'Mobil, Web ve Desktop',
        'Email Destek',
        '1 Şirket/Veritabanı Bağlantısı',
        'SQL Sorgu Desteği',
        'Tarih Filtreleri',
      ],
    },
    {
      name: 'Profesyonel',
      price: '980',
      period: 'yıl',
      description: 'Büyüyen ekipler için',
      features: [
        '6 Dashboard Raporu',
        '3 Dashboard Liste Raporu',
        '3 Dashboard Pie Raporu',
        '10 Normal Rapor',
        'Mobil, Web ve Desktop',
        'Öncelikli Destek',
        '3 Şirket/Veritabanı Bağlantısı',
        'SQL Sorgu Desteği',
        'Tarih Filtreleri',
      ],
      popular: true,
    },
    {
      name: 'Kurumsal',
      price: 'Özel',
      period: 'yıl',
      description: 'Büyük şirketler için',
      features: [
        'Sınırsız Kullanıcı',
        'Sınırsız Rapor',
        'Tüm Platform Desteği',
        '7/24 Destek',
        'Sınırsız Connector',
        'Özel Geliştirme',
        'On-Premise Kurulum',
        'API Erişimi',
      ],
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-900 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Fiyatlandırma
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            İhtiyacınıza uygun planı seçin. Tüm planlarda 14 gün ücretsiz deneme süresi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 ${plan.popular
                ? 'border-blue-500 dark:border-blue-400 shadow-xl scale-105'
                : 'border-gray-200 dark:border-gray-700'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 text-sm font-semibold text-white bg-blue-500 rounded-full">
                    En Popüler
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center">
                  {plan.period ? (
                    <>
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">
                        €{plan.price}
                      </span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        / {plan.period}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {plan.price} Fiyat
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="https://app.ensql.com.tr"
                className={`block w-full py-3 px-4 text-center font-semibold rounded-lg transition-colors ${plan.popular
                  ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {plan.period ? 'Başlayın' : 'İletişime Geçin'}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Tüm fiyatlar KDV hariçtir.
          </p>
        </div>
      </div>
    </div>
  )
}
