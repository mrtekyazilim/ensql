import { useState, useEffect } from 'react'
import axios from 'axios'

interface User {
  _id: string
  companyName?: string
  username: string
  clientId: string
  clientPassword?: string
  hizmetBitisTarihi: string
  aktif: boolean
  kullanimIstatistikleri?: {
    toplamSorguSayisi: number
    sonGirisTarihi?: string
  }
}

export function UserDetailsModal({ user, onClose }: { user: User | null, onClose: () => void }) {
  if (!user) return null

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Müşteri Bilgileri
            </h3>
            <div className="space-y-3">
              {user.companyName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Müşteri/Şirket İsmi</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    {user.companyName}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kullanıcı Adı</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  {user.username}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client ID</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded font-mono">
                  {user.clientId}
                </p>
              </div>
              {user.clientPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client Password</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded font-mono">
                    {user.clientPassword}
                  </p>
                  <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Bu şifreyi kaydedin! Bir daha görüntülenemez.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hizmet Bitiş Tarihi</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  {new Date(user.hizmetBitisTarihi).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
