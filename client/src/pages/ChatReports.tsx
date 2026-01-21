import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { MessageCircle, Send, Loader2, Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.3);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.5);
  }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(75, 85, 99, 0.4);
  }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(75, 85, 99, 0.6);
  }
`

interface Message {
  id: string
  type: 'user' | 'assistant' | 'error'
  content: string
  timestamp: Date
  report?: {
    _id: string
    raporAdi: string
    aciklama: string
    kategori?: string
    raporTuru?: string
  }
  data?: any[]
  metadata?: {
    kayitSayisi: number
    calistirilmaTarihi: string
  }
  suggestions?: Array<{
    _id: string
    raporAdi: string
    aciklama: string
    kategori?: string
  }>
}

const ChatReports: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // LocalStorage'dan chat geçmişini yükle
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatReportsHistory')
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })))
      } catch (error) {
        console.error('Chat geçmişi yüklenirken hata:', error)
      }
    } else {
      // İlk karşılama mesajı
      setMessages([{
        id: '1',
        type: 'assistant',
        content: 'Merhaba! Size raporlarınızı bulmakta yardımcı olabilirim. Ne aramak istersiniz?',
        timestamp: new Date()
      }])
    }
  }, [])

  // Mesajlar değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatReportsHistory', JSON.stringify(messages))
    }
  }, [messages])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.post(
        'http://localhost:13201/api/chat/ask',
        { message: inputMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.data.message,
          timestamp: new Date(),
          report: response.data.report,
          data: response.data.data,
          metadata: response.data.metadata
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Belirsizlik veya hata durumu
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: response.data.ambiguous ? 'assistant' : 'error',
          content: response.data.message,
          timestamp: new Date(),
          suggestions: response.data.suggestions
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: error.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSuggestionClick = async (suggestion: any) => {
    const messageText = `"${suggestion.raporAdi}" raporunu göster`

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.post(
        'http://localhost:13201/api/chat/ask',
        {
          message: messageText,
          reportId: suggestion._id // Direkt rapor ID'si gönder
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.data.message,
          timestamp: new Date(),
          report: response.data.report,
          data: response.data.data,
          metadata: response.data.metadata
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: response.data.ambiguous ? 'assistant' : 'error',
          content: response.data.message,
          timestamp: new Date(),
          suggestions: response.data.suggestions
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: error.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleQuickAction = (text: string) => {
    setInputMessage(text)
    setTimeout(() => handleSendMessage(), 100)
  }

  const clearHistory = () => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: 'Merhaba! Size raporlarınızı bulmakta yardımcı olabilirim. Ne aramak istersiniz?',
      timestamp: new Date()
    }])
    localStorage.removeItem('chatReportsHistory')
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chat Rapor</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Raporlarınızı doğal dille arayın</p>
              </div>
            </div>
            <button
              onClick={clearHistory}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Geçmişi Temizle
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Hızlı Aksiyonlar:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickAction('Bugünkü satışlar')}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                Bugünkü satışlar
              </button>
              <button
                onClick={() => handleQuickAction('Bu ayki rapor')}
                className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
              >
                Bu ayki rapor
              </button>
              <button
                onClick={() => handleQuickAction('Stok durumu')}
                className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
              >
                Stok durumu
              </button>
              <button
                onClick={() => handleQuickAction('Geçen ayın satışları')}
                className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg text-sm hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
              >
                Geçen ayın satışları
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl ${message.type === 'user'
                  ? 'bg-indigo-600 text-white'
                  : message.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-800'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'
                  } rounded-2xl px-4 py-3`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Report Info */}
                {message.report && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-semibold text-sm">{message.report.raporAdi}</span>
                      </div>
                      {message.report.raporTuru === 'normal-report' && (
                        <a
                          href={`/reports/${message.report._id}`}
                          className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                        >
                          Raporu Aç
                        </a>
                      )}
                    </div>
                    {message.report.kategori && (
                      <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        {message.report.kategori}
                      </span>
                    )}
                  </div>
                )}

                {/* Data Table */}
                {message.data && message.data.length > 0 && (
                  <div className="mt-3 overflow-x-auto custom-scrollbar">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden border border-gray-200 dark:border-gray-600 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              {Object.keys(message.data[0]).map((key) => (
                                <th
                                  key={key}
                                  className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                                >
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {message.data.slice(0, 10).map((row, idx) => (
                              <tr key={idx}>
                                {Object.values(row).map((value: any, cellIdx) => (
                                  <td
                                    key={cellIdx}
                                    className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200"
                                  >
                                    {value !== null && value !== undefined ? String(value) : '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {message.data.length > 10 && (
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          İlk 10 kayıt gösteriliyor. Toplam: {message.metadata?.kayitSayisi}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.suggestions.map((suggestion) => (
                      <button
                        key={suggestion._id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{suggestion.raporAdi}</p>
                        {suggestion.aciklama && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{suggestion.aciklama}</p>
                        )}
                        {suggestion.kategori && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs">
                            {suggestion.kategori}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs mt-2 opacity-70">{formatTime(message.timestamp)}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Raporları doğal dille arayın... (örn: bugünkü satışlar)"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputMessage.trim()}
              className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ChatReports
