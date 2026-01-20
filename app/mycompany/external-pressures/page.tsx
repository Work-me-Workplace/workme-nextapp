'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { AlertTriangle, Plus } from 'lucide-react'
import api from '@/lib/api'

interface ExternalCompanyPressure {
  id: string
  source: string
  title: string
  summary: string
  impact?: string | null
  workforceConcern: string
  levelOfSeverity: number
  createdAt: string
}

export default function ExternalCompanyPressuresPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [pressures, setPressures] = useState<ExternalCompanyPressure[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadPressures()
      }
    }
  }, [router])

  async function loadPressures() {
    try {
      setLoading(true)
      const response = await api.get('/api/external-pressures/list')
      
      if (response.data.success && response.data.pressures) {
        setPressures(response.data.pressures)
      } else {
        console.error('Failed to load pressures:', response.data.error)
        setPressures([])
      }
    } catch (error) {
      console.error('Failed to load pressures:', error)
      setPressures([])
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">External Company Pressures</h1>
                <p className="text-gray-600 mt-2">Track external pressures from GAO, Congress, Industry, etc.</p>
              </div>
              <Link
                href="/mycompany/external-pressures/create"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Pressure
              </Link>
            </div>

            {pressures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pressures.map(pressure => (
                  <Link
                    key={pressure.id}
                    href={`/mycompany/external-pressures/${pressure.id}`}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <AlertTriangle className={`h-5 w-5 mr-2 ${
                          pressure.levelOfSeverity >= 4 ? 'text-red-600' :
                          pressure.levelOfSeverity >= 2 ? 'text-orange-600' :
                          'text-yellow-600'
                        }`} />
                        <span className="text-xs font-medium text-gray-500">
                          {new Date(pressure.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700">
                        Severity: {pressure.levelOfSeverity}/5
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{pressure.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500">Source: {pressure.source.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs font-medium text-blue-600">{pressure.workforceConcern.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">{pressure.summary}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No External Pressures</h3>
                <p className="text-gray-600 mb-4">Track external pressures from GAO, Congress, Industry, etc.</p>
                <Link
                  href="/mycompany/external-pressures/create"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Create Your First Pressure
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

