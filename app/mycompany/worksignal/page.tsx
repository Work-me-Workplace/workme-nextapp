'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Sparkles, Calendar, TrendingUp, Users } from 'lucide-react'

interface WorkSignal {
  id: string
  type: 'meeting' | 'note' | 'leader_comment' | 'external_hint'
  title: string
  summary: string
  source?: string
  createdAt: string
}

export default function WorkSignalPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [signals, setSignals] = useState<WorkSignal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadSignals()
      }
    }
  }, [router])

  async function loadSignals() {
    try {
      setLoading(true)
      // TODO: Implement API call to fetch work signals
      setSignals([])
    } catch (error) {
      console.error('Failed to load signals:', error)
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">WorkSignal</h1>
              <p className="text-gray-600 mt-2">Organizational breadcrumbs and signals</p>
            </div>

            {signals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {signals.map(signal => (
                  <Link
                    key={signal.id}
                    href={`/mycompany/worksignal/${signal.id}`}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-purple-500"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-500 uppercase bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {signal.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(signal.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{signal.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{signal.summary}</p>
                    {signal.source && (
                      <p className="text-xs text-gray-500 mt-2">Source: {signal.source}</p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Sparkles className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No WorkSignals</h3>
                <p className="text-gray-600 mb-4">WorkSignals capture organizational breadcrumbs from meetings, notes, and leader comments.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

