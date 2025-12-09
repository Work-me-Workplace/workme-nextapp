'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { MessageSquare, FileText, Sparkles, History, ArrowRight } from 'lucide-react'
import api from '@/lib/api'

interface Template {
  id: string
  name: string
  body: string
  createdAt: string
}

interface Highlight {
  id: string
  achievement?: string | null
  citationText: string
  createdAt: string
  employees: Array<{
    employee: {
      fullName: string
    }
  }>
}

interface EngageMessage {
  id: string
  message: string
  createdAt: string
  template?: {
    name: string
  } | null
}

export default function EngageIndexPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [recentMessages, setRecentMessages] = useState<EngageMessage[]>([])
  const [recentHighlights, setRecentHighlights] = useState<Highlight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadData()
      }
    }
  }, [router])

  async function loadData() {
    try {
      setLoading(true)
      
      // Load templates
      const templatesRes = await api.get('/api/workengage/template')
      if (templatesRes.data.success) {
        setTemplates(templatesRes.data.data.slice(0, 5)) // Recent 5
      }

      // Load recent messages
      const messagesRes = await api.get('/api/workengage/history')
      if (messagesRes.data.success) {
        setRecentMessages(messagesRes.data.data.slice(0, 5)) // Recent 5
      }

      // Load recent highlights
      const highlightsRes = await api.get('/api/workengage/highlight')
      if (highlightsRes.data.success) {
        setRecentHighlights(highlightsRes.data.data.slice(0, 5)) // Recent 5
      }
    } catch (error) {
      console.error('Failed to load data:', error)
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
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Engage</h1>
            <p className="text-gray-600 mb-8">What do you want to say today?</p>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Link
                href="/engage/compose"
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <MessageSquare className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Compose</h3>
                <p className="text-sm text-gray-600">Create a new engagement message</p>
              </Link>
              <Link
                href="/engage/templates"
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <FileText className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Templates</h3>
                <p className="text-sm text-gray-600">Manage your message templates</p>
              </Link>
              <Link
                href="/engage/highlights"
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <Sparkles className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Highlights</h3>
                <p className="text-sm text-gray-600">Browse employee highlights</p>
              </Link>
              <Link
                href="/engage/history"
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <History className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">History</h3>
                <p className="text-sm text-gray-600">View past messages</p>
              </Link>
            </div>

            {/* Unified Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Templates Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Templates</h2>
                  <Link
                    href="/engage/templates"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    View all <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
                {templates.length === 0 ? (
                  <p className="text-sm text-gray-500">No templates yet</p>
                ) : (
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 bg-gray-50 rounded border border-gray-100"
                      >
                        <h3 className="font-medium text-sm text-gray-900 mb-1">
                          {template.name}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {template.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Messages Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Your Last Messages</h2>
                  <Link
                    href="/engage/history"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    View all <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
                {recentMessages.length === 0 ? (
                  <p className="text-sm text-gray-500">No messages yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentMessages.map((message) => (
                      <div
                        key={message.id}
                        className="p-3 bg-gray-50 rounded border border-gray-100"
                      >
                        {message.template && (
                          <span className="text-xs text-blue-600 font-medium mb-1 block">
                            {message.template.name}
                          </span>
                        )}
                        <p className="text-xs text-gray-700 line-clamp-3">
                          {message.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Highlights Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Highlights</h2>
                  <Link
                    href="/engage/highlights"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    View all <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
                {recentHighlights.length === 0 ? (
                  <p className="text-sm text-gray-500">No highlights yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentHighlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className="p-3 bg-gray-50 rounded border border-gray-100"
                      >
                        <h3 className="font-medium text-sm text-gray-900 mb-1">
                          {highlight.employees[0]?.employee?.fullName || 'Employee'}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {highlight.achievement || highlight.citationText}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

