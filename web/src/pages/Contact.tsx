import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react'

export function Contact() {
  return (
    <div className="bg-white dark:bg-gray-900 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            İletişim
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Sorularınız için bize ulaşın. Size yardımcı olmaktan mutluluk duyarız.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* İletişim Bilgileri */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Email
                  </h3>
                  <a
                    href="mailto:iletisim@ensql.com.tr"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    iletisim@ensql.com.tr
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-gray-900 dark:text-white">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Phone className="w-6 h-6 " />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold  mb-2">
                    Telefon
                  </h3>
                  <a
                    href="tel:+905327298827"
                    className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  >
                    +90 532 729 88 27
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-gray-900 dark:text-white">
              <a
                href="https://wa.me/905327298827"
                target="_blank"
                rel="noopener noreferrer"
                className="block "
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold  mb-2">
                      WhatsApp
                    </h3>

                    +90 532 729 88 27

                  </div>
                </div>
              </a>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-gray-900 dark:text-white">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <MapPin className="w-6 h-6 " />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold  mb-2">
                    Adres
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Kavaklık Mah. Şehit Kaan ŞEN Sokak<br />
                    No:1 / 3 Şahinbey<br />
                    Gaziantep, Türkiye
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Çalışma Saatleri
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Pazartesi - Cuma: 09:00 - 18:00<br />
                Cumartesi - Pazar: Kapalı
              </p>
            </div>
          </div>

          {/* Google Maps */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d244.85298809779454!2d37.36343276261267!3d37.06067258989192!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2str!4v1768781733009!5m2!1sen!2str"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '500px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="EnSQL Konum"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
