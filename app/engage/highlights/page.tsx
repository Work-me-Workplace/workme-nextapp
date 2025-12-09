'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Sparkles, ArrowRight } from 'lucide-react'
import api from '@/lib/api'

interface Highlight {
  id: string
  achievement?: string | null
  citationText: string
  narrative?: string | null
  classification?: string | null
  awardName?: string | null
  createdAt: string
  employees: Array<{
    employee: {
      fullName: string
      title?: string | null
    }
  }>
}

export default function HighlightsPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadHighlights()
      }
    }
  }, [router])

  async function loadHighlights() {
    try {
      setLoading(true)
      const response = await api.get('/api/workengage/highlight')
      
      if (response.data.success) {
        setHighlights(response.data.data)
      } else {
        console.error('Failed to load highlights:', response.data.error)
        setHighlights([])
      }
    } catch (error) {
      console.error('Failed to load highlights:', error)
      setHighlights([])
    } finally {
      setLoading(false)
    }
  }

  function getCitationExcerpt(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Highlights</h1>
            <p className="text-gray-600 mb-8">Browse employee highlights for inspiration</p>

            {highlights.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No highlights yet</h3>
                <p className="text-gray-600">
                  Employee highlights will appear here once they're created
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {highlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 mr-3">
                            {highlight.employees[0]?.employee?.fullName || 'Employee'}
                          </h3>
                          {highlight.employees[0]?.employee?.title && (
                            <span className="text-sm text-gray-500">
                              {highlight.employees[0].employee.title}
                            </span>
                          )}
                        </div>
                        
                        {highlight.achievement && (
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            {highlight.achievement}
                          </p>
                        )}
                        
                        {highlight.narrative && (
                          <p className="text-sm text-gray-700 mb-2">
                            {highlight.narrative}
                          </p>
                        )}
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {getCitationExcerpt(highlight.citationText)}
                        </p>

                        {highlight.awardName && (
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                            <span className="font-medium">{highlight.awardName}</span>
                            {highlight.classification && (
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                {highlight.classification}
                              </span>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mb-4">
                          {new Date(highlight.createdAt).toLocaleDateString()}
                        </p>

                        <Link
                          href={`/engage/compose?highlightId=${highlight.id}`}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Use this highlight → Compose
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
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

