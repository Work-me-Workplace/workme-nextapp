'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
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

const SEVERITY_LABELS = [
  'Informational / Low Concern',
  'Mild Background Concern',
  'Noticeable but Contained',
  'Disruptive to Focus or Planning',
  'High Anxiety / Widespread Concern',
  'Existential (Job, Identity, Trust at Risk)',
] as const

export default function ExternalCompanyPressureDetailPage() {
  const router = useRouter()
  const params = useParams()
  const pressureId = params.id as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [pressure, setPressure] = useState<ExternalCompanyPressure | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadPressure()
      }
    }
  }, [router, pressureId])

  async function loadPressure() {
    try {
      setLoading(true)
      const response = await api.get(`/api/external-pressures/${pressureId}`)
      
      if (response.data.success && response.data.pressure) {
        setPressure(response.data.pressure)
      } else {
        console.error('Failed to load pressure:', response.data.error)
      }
    } catch (error) {
      console.error('Failed to load pressure:', error)
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

  if (!pressure) {
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
            </div>
          </div>
        </nav>
        <div className="flex">
          <SidebarNav />
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <p className="text-gray-600">Pressure not found</p>
            </div>
          </main>
        </div>
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
            <Link
              href="/mycompany/external-pressures"
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to External Pressures
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start">
                  <AlertTriangle className={`h-8 w-8 mr-3 ${
                    pressure.levelOfSeverity >= 4 ? 'text-red-600' :
                    pressure.levelOfSeverity >= 2 ? 'text-orange-600' :
                    'text-yellow-600'
                  }`} />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{pressure.title}</h1>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-gray-600">Source: {pressure.source.replace(/_/g, ' ')}</span>
                      <span className="text-sm text-blue-600 font-medium">{pressure.workforceConcern.replace(/_/g, ' ')}</span>
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${
                        pressure.levelOfSeverity >= 4 ? 'bg-red-100 text-red-700' :
                        pressure.levelOfSeverity >= 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        Severity: {pressure.levelOfSeverity}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Summary</h2>
                <p className="text-gray-700">{pressure.summary}</p>
              </div>

              {pressure.impact && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Impact</h2>
                  <p className="text-gray-700">{pressure.impact}</p>
                </div>
              )}

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Severity Interpretation</h2>
                <p className="text-sm text-gray-600">
                  {SEVERITY_LABELS[pressure.levelOfSeverity]}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Created: {new Date(pressure.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

