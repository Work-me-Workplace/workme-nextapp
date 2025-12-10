'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Award, Plus } from 'lucide-react'
import api from '@/lib/api'

interface Highlight {
  id: string
  citationText: string
  achievement?: string | null
  classification?: string | null
  awardName?: string | null
  awardingAgency?: string | null
  awardYear?: number | null
  photoUrl?: string | null
  createdAt: string
  updatedAt: string
  employees: Array<{
    id: string
    fullName: string
    title?: string | null
    photoUrl?: string | null
  }>
  companyUnits: string[]
}

export default function EmployeeHighlightsPage() {
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
      const response = await api.get('/api/company/highlights')
      
      if (response.data.success && response.data.highlights) {
        setHighlights(response.data.highlights)
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

  function getClassificationColor(classification?: string | null): string {
    if (!classification) return 'bg-gray-100 text-gray-800'
    const lower = classification.toLowerCase()
    if (lower.includes('leadership')) return 'bg-blue-100 text-blue-800'
    if (lower.includes('innovation')) return 'bg-purple-100 text-purple-800'
    if (lower.includes('excellence')) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  function getCitationExcerpt(text: string, maxLength: number = 150): string {
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
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.clear()
                  router.push('/signin')
                }}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Employee Highlights</h1>
                <p className="text-gray-600 mt-2">Award citations, recognition, and employee achievements</p>
              </div>
              <Link
                href="/mycompany/highlights/new"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Employee Highlight
              </Link>
            </div>

            {highlights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {highlights.map(highlight => (
                  <Link
                    key={highlight.id}
                    href={`/mycompany/highlights/${highlight.id}`}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
                  >
                    <div className="flex items-center mb-3">
                      <Award className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-xs font-medium text-gray-500">
                        {new Date(highlight.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Employee names */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {highlight.employees.map(e => e.fullName).join(', ')}
                    </h3>
                    
                    {/* Award name */}
                    {highlight.awardName && (
                      <p className="text-sm font-medium text-gray-700 mb-2">{highlight.awardName}</p>
                    )}
                    
                    {/* Citation excerpt */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {getCitationExcerpt(highlight.citationText)}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {highlight.classification && (
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getClassificationColor(highlight.classification)}`}>
                          {highlight.classification}
                        </span>
                      )}
                      {highlight.awardYear && (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                          {highlight.awardYear}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Highlights</h3>
                <p className="text-gray-600 mb-4">Track employee awards, recognition, and achievements.</p>
                <Link
                  href="/mycompany/highlights/new"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Add Your First Highlight
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
