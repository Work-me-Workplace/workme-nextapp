'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { History, FileText, Sparkles } from 'lucide-react'
import api from '@/lib/api'

interface EngageMessage {
  id: string
  message: string
  createdAt: string
  template?: {
    id: string
    name: string
  } | null
  highlight?: {
    id: string
    achievement?: string | null
    employees: Array<{
      employee: {
        fullName: string
      }
    }>
  } | null
}

export default function HistoryPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [messages, setMessages] = useState<EngageMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadHistory()
      }
    }
  }, [router])

  async function loadHistory() {
    try {
      setLoading(true)
      const response = await api.get('/api/workengage/history')
      
      if (response.data.success) {
        setMessages(response.data.data)
      } else {
        console.error('Failed to load history:', response.data.error)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to load history:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">History</h1>
            <p className="text-gray-600 mb-8">View all your engagement messages</p>

            {messages.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-600 mb-4">
                  Your engagement messages will appear here once you create them
                </p>
                <a
                  href="/engage/compose"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Message
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {message.template && (
                            <div className="flex items-center text-sm text-blue-600">
                              <FileText className="h-4 w-4 mr-1" />
                              <span className="font-medium">{message.template.name}</span>
                            </div>
                          )}
                          {message.highlight && (
                            <div className="flex items-center text-sm text-purple-600">
                              <Sparkles className="h-4 w-4 mr-1" />
                              <span className="font-medium">
                                {message.highlight.employees[0]?.employee?.fullName || 'Employee'}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap mb-3">
                          {message.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

