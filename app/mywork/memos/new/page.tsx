'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { ArrowLeft, Save, Calendar } from 'lucide-react'
import api from '@/lib/api'

export default function NewMemoPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    whatHappened: '',
    whySpecial: '',
    myRole: '',
    impact: '',
    thoughts: '',
    contextType: 'OTHER',
    happenedAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.whatHappened.trim()) {
      setError('Please describe what happened')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/api/memo/create', {
        whatHappened: formData.whatHappened,
        whySpecial: formData.whySpecial || undefined,
        myRole: formData.myRole || undefined,
        impact: formData.impact || undefined,
        thoughts: formData.thoughts || undefined,
        contextType: formData.contextType,
        happenedAt: new Date(formData.happenedAt).toISOString(),
      })

      if (response.data.success) {
        router.push(`/mywork/memos/${response.data.memo.id}`)
      }
    } catch (err: any) {
      console.error('Failed to create memo:', err)
      setError(err.response?.data?.error || 'Failed to create memo')
    } finally {
      setLoading(false)
    }
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
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/mywork/memos"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Memos
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Capture a Work Moment</h1>
              <p className="text-gray-600 mt-2">
                Record what happened, why it matters, and what you contributed
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                {/* Date and Context Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      When did this happen?
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.happenedAt}
                        onChange={(e) => handleChange('happenedAt', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Context Type
                    </label>
                    <select
                      value={formData.contextType}
                      onChange={(e) => handleChange('contextType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="EVENT">Event</option>
                      <option value="MEETING">Meeting</option>
                      <option value="DELIVERY">Delivery</option>
                      <option value="RECOGNITION">Recognition</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* What Happened */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What happened? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.whatHappened}
                    onChange={(e) => handleChange('whatHappened', e.target.value)}
                    placeholder="Describe the work moment in factual terms..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                </div>

                {/* Why Special */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why did this matter?
                  </label>
                  <textarea
                    value={formData.whySpecial}
                    onChange={(e) => handleChange('whySpecial', e.target.value)}
                    placeholder="Why was this moment significant or meaningful?"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* My Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What was your role?
                  </label>
                  <textarea
                    value={formData.myRole}
                    onChange={(e) => handleChange('myRole', e.target.value)}
                    placeholder="How did you contribute?"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Impact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What was the impact?
                  </label>
                  <textarea
                    value={formData.impact}
                    onChange={(e) => handleChange('impact', e.target.value)}
                    placeholder="What outcome or effect resulted from this?"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Thoughts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal reflections (optional)
                  </label>
                  <textarea
                    value={formData.thoughts}
                    onChange={(e) => handleChange('thoughts', e.target.value)}
                    placeholder="Any personal thoughts, feelings, or lessons learned?"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-4">
                <Link
                  href="/mywork/memos"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || !formData.whatHappened.trim()}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  <Save className="w-5 h-5" />
                  <span>{loading ? 'Saving...' : 'Save Memo'}</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
