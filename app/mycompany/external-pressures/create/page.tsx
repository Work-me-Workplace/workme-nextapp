'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'

const PRESSURE_SOURCES = [
  'CONGRESS',
  'OSD',
  'NAVSEA_LEADERSHIP',
  'PEO',
  'POLICY',
  'BUDGET',
  'GAO',
  'INDUSTRY',
  'OPERATIONS',
  'TECHNOLOGY',
  'CYBER',
] as const

const WORKFORCE_CONCERNS = [
  { value: 'JOB_SECURITY', label: 'Job Security - "Will I still have a job?"' },
  { value: 'ROLE_CLARITY', label: 'Role Clarity - "What is my role / does it still matter?"' },
  { value: 'FAIRNESS', label: 'Fairness - "Is the burden shared equitably?"' },
  { value: 'ADMIN_FRICTION', label: 'Admin Friction - "Why is it harder to do my job?"' },
  { value: 'TRUST_CREDIBILITY', label: 'Trust & Credibility - "Do leadership actions match reality?"' },
] as const

const SEVERITY_LABELS = [
  'Informational / Low Concern',
  'Mild Background Concern',
  'Noticeable but Contained',
  'Disruptive to Focus or Planning',
  'High Anxiety / Widespread Concern',
  'Existential (Job, Identity, Trust at Risk)',
] as const

export default function CreateExternalCompanyPressurePage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    source: 'GAO',
    title: '',
    summary: '',
    impact: '',
    workforceConcern: 'JOB_SECURITY',
    levelOfSeverity: 2,
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
      }
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workMeId) return

    try {
      setLoading(true)
      const response = await api.post('/api/external-pressures/create', formData)
      
      if (response.data.success) {
        router.push(`/mycompany/external-pressures/${response.data.pressure.id}`)
      } else {
        console.error('Failed to create pressure:', response.data.error)
        alert('Failed to create pressure: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to create pressure:', error)
      alert('Failed to create pressure: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId) {
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
            <Link
              href="/mycompany/external-pressures"
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to External Pressures
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center mb-6">
                <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Create External Company Pressure</h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                    Source *
                  </label>
                  <select
                    id="source"
                    required
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {PRESSURE_SOURCES.map(source => (
                      <option key={source} value={source}>{source.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., PAE Realignment, Budget / CR Uncertainty"
                  />
                </div>

                <div>
                  <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
                    Summary *
                  </label>
                  <textarea
                    id="summary"
                    rows={4}
                    required
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What is happening..."
                  />
                </div>

                <div>
                  <label htmlFor="impact" className="block text-sm font-medium text-gray-700 mb-2">
                    Impact
                  </label>
                  <textarea
                    id="impact"
                    rows={3}
                    value={formData.impact}
                    onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Why it matters to work..."
                  />
                </div>

                <div>
                  <label htmlFor="workforceConcern" className="block text-sm font-medium text-gray-700 mb-2">
                    Workforce Concern *
                  </label>
                  <select
                    id="workforceConcern"
                    required
                    value={formData.workforceConcern}
                    onChange={(e) => setFormData({ ...formData, workforceConcern: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {WORKFORCE_CONCERNS.map(concern => (
                      <option key={concern.value} value={concern.value}>{concern.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="levelOfSeverity" className="block text-sm font-medium text-gray-700 mb-2">
                    Level of Severity: {formData.levelOfSeverity}/5 - {SEVERITY_LABELS[formData.levelOfSeverity]} *
                  </label>
                  <input
                    type="range"
                    id="levelOfSeverity"
                    min="0"
                    max="5"
                    required
                    value={formData.levelOfSeverity}
                    onChange={(e) => setFormData({ ...formData, levelOfSeverity: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0 - Low</span>
                    <span>5 - Critical</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <Link
                    href="/mycompany/external-pressures"
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Pressure'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
