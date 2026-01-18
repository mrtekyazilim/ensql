import { Download, Smartphone, Monitor, Tablet, Globe } from 'lucide-react'

export function Downloads() {
  const platforms = [
    {
      name: 'Windows',
      icon: Monitor,
      description: 'Windows 10 ve üzeri için masaüstü uygulaması',
      version: '1.0.0',
      size: '85 MB',
      downloadUrl: '/downloads/ensql-windows-1.0.0.exe',
      available: false,
    },
    {
      name: 'Android',
      icon: Smartphone,
      description: 'Android 8.0 ve üzeri için mobil uygulama',
      version: '1.0.0',
      size: '25 MB',
      downloadUrl: '/downloads/ensql-android-1.0.0.apk',
      available: false,
    },
    {
      name: 'iOS',
      icon: Tablet,
      description: 'iPhone ve iPad için uygulama',
      version: '1.0.0',
      size: '30 MB',
      downloadUrl: 'https://apps.apple.com/ensql',
      available: false,
    },
    {
      name: 'macOS',
      icon: Monitor,
      description: 'macOS 11 ve üzeri için uygulama',
      version: '1.0.0',
      size: '95 MB',
      downloadUrl: '/downloads/ensql-macos-1.0.0.dmg',
      available: false,
    },
    {
      name: 'Web',
      icon: Globe,
      description: 'Tarayıcı üzerinden erişim (PWA)',
      version: 'Her Zaman Güncel',
      size: '-',
      downloadUrl: 'http://localhost:13203',
      available: true,
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-900 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            İndirmeler
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            EnSQL'i cihazınıza indirin ve her yerden raporlarınıza erişin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {platforms.map((platform, index) => (
            <div
              key={index}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-lg bg-gradient-to-br from-blue-500 dark:from-blue-600 to-indigo-600 dark:to-indigo-700">
                <platform.icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {platform.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {platform.description}
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Versiyon:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {platform.version}
                  </span>
                </div>
                {platform.size !== '-' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Boyut:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {platform.size}
                    </span>
                  </div>
                )}
              </div>

              {platform.available ? (
                <a
                  href={platform.downloadUrl}
                  target={platform.name === 'Web' ? '_blank' : undefined}
                  rel={platform.name === 'Web' ? 'noopener noreferrer' : undefined}
                  className="flex items-center justify-center w-full py-3 px-4 text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg font-semibold transition-colors"
                >
                  {platform.name === 'Web' ? (
                    <>
                      <Globe className="w-5 h-5 mr-2" />
                      Aç
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      İndir
                    </>
                  )}
                </a>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center w-full py-3 px-4 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg font-semibold cursor-not-allowed"
                >
                  Yakında
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <div className="p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              📱 Hemen Başlayın
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Web versiyonunu kullanarak hemen başlayabilirsiniz. Masaüstü ve mobil uygulamalar
              yakında yayınlanacak. Web versiyonu Progressive Web App (PWA) olarak çalışır ve
              cihazınıza kurulabilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
