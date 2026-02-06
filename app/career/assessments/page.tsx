'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { Plus, Edit2, Trash2, FileText, Calendar } from 'lucide-react'
import api from '@/lib/api'

interface ContributionSummary {
  id: string
  periodStart: string
  periodEnd: string
  periodType: string | null
  title: string | null
  summary: string | null
  skillTopicIds: string[]
  companyWorkId: string | null
  createdAt: string
  updatedAt: string
}

export default function AssessmentsPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<ContributionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSummary, setEditingSummary] = useState<ContributionSummary | null>(null)
  const [formData, setFormData] = useState({
    periodStart: '',
    periodEnd: '',
    periodType: 'annual',
    title: '',
    summary: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadSummaries()
      }
    }
  }, [router])

  async function loadSummaries() {
    setLoading(true)
    try {
      const response = await api.get('/api/contribution-summaries')
      if (response.data.success) {
        setSummaries(response.data.summaries || [])
      }
    } catch (error) {
      console.error('Failed to load assessments:', error)
    }
    setLoading(false)
  }

  function handleNewAssessment() {
    // Default to current year
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const yearEnd = new Date(now.getFullYear(), 11, 31)
    
    setEditingSummary(null)
    setFormData({
      periodStart: yearStart.toISOString().split('T')[0],
      periodEnd: yearEnd.toISOString().split('T')[0],
      periodType: 'annual',
      title: `${now.getFullYear()} Annual Contribution Summary`,
      summary: '',
    })
    setShowForm(true)
  }

  function handleEditSummary(summary: ContributionSummary) {
    setEditingSummary(summary)
    setFormData({
      periodStart: new Date(summary.periodStart).toISOString().split('T')[0],
      periodEnd: new Date(summary.periodEnd).toISOString().split('T')[0],
      periodType: summary.periodType || 'annual',
      title: summary.title || '',
      summary: summary.summary || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.periodStart || !formData.periodEnd) return

    setSubmitting(true)
    try {
      if (editingSummary) {
        await api.put(`/api/contribution-summaries/${editingSummary.id}`, formData)
      } else {
        await api.post('/api/contribution-summaries', formData)
      }
      setShowForm(false)
      setEditingSummary(null)
      setFormData({ periodStart: '', periodEnd: '', periodType: 'annual', title: '', summary: '' })
      loadSummaries()
    } catch (error: any) {
      console.error('Failed to save assessment:', error)
      alert(error.response?.data?.error || 'Failed to save assessment')
    }
    setSubmitting(false)
  }

  async function handleDelete(summaryId: string) {
    if (!confirm('Are you sure you want to delete this assessment?')) return

    try {
      await api.delete(`/api/contribution-summaries/${summaryId}`)
      loadSummaries()
    } catch (error: any) {
      console.error('Failed to delete assessment:', error)
      alert(error.response?.data?.error || 'Failed to delete assessment')
    }
  }

  const isActive = (path: string) => {
    if (path === '/career') return pathname === path
    return pathname?.startsWith(path)
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
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/mywork" className="flex items-center space-x-2">
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
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Career
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/career"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/career') && pathname === '/career'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/career/goals"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/career/goals')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Goals (North Star)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/career/assessments"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/career/assessments')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Assessments
                  </Link>
                </li>
                <li>
                  <Link
                    href="/career/appraisal-helper"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/career/appraisal-helper')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Appraisal Helper
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Contribution Assessments</h2>
                <p className="text-gray-600 mt-2">Document what you actually accomplished (post-work)</p>
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This is a manual helper for MVP1. The intended flow is: 
                    <strong> Event → Work → Contribution → Assessment</strong> (automatic generation). 
                    For now, you can manually document accomplishments. Full flow coming soon!
                  </p>
                </div>
              </div>
              <button
                onClick={handleNewAssessment}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5" />
                <span>New Assessment</span>
              </button>
            </div>

            {/* Form Modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4">
                    {editingSummary ? 'Edit Assessment' : 'New Assessment'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Period Start *
                        </label>
                        <input
                          type="date"
                          value={formData.periodStart}
                          onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Period End *
                        </label>
                        <input
                          type="date"
                          value={formData.periodEnd}
                          onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Period Type
                      </label>
                      <select
                        value={formData.periodType}
                        onChange={(e) => setFormData({ ...formData, periodType: e.target.value })}
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="annual">Annual</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="project">Project</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., 2025 Annual Contribution Summary"
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Summary *
                      </label>
                      <textarea
                        value={formData.summary}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                        placeholder="Describe what you accomplished during this period..."
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={8}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This is a helper for your appraisal - doesn't need to be perfect, just document what you did.
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submitting ? 'Saving...' : editingSummary ? 'Update' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false)
                          setEditingSummary(null)
                          setFormData({ periodStart: '', periodEnd: '', periodType: 'annual', title: '', summary: '' })
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Summaries List */}
            {summaries.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessments Yet</h3>
                <p className="text-gray-600 mb-4">Create your first contribution assessment to document what you accomplished</p>
                <button
                  onClick={handleNewAssessment}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Create First Assessment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {summaries.map((summary) => (
                  <div
                    key={summary.id}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <FileText className="h-6 w-6 text-blue-600" />
                          <h3 className="text-xl font-semibold text-gray-900">
                            {summary.title || 'Untitled Assessment'}
                          </h3>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            {new Date(summary.periodStart).toLocaleDateString()} - {new Date(summary.periodEnd).toLocaleDateString()}
                          </span>
                          {summary.periodType && (
                            <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {summary.periodType}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditSummary(summary)}
                          className="text-gray-400 hover:text-blue-600 transition"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(summary.id)}
                          className="text-gray-400 hover:text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {summary.summary && (
                      <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{summary.summary}</p>
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-4">
                      Created {new Date(summary.createdAt).toLocaleDateString()}
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
