'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { refreshWorkMe } from '@/lib/workme.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Heart, ArrowLeft, Wand2, Loader2, CheckCircle } from 'lucide-react'

interface LivingHomageData {
  fullName: string
  role?: string | null
  relation?: string | null
  notes?: string | null
}

export default function LivingHomagePage({ params }: { params: Promise<{ id: string; unitId: string }> }) {
  const { id: platformId, unitId } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [reviewData, setReviewData] = useState<LivingHomageData | null>(null)
  const [aiText, setAiText] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setAuthReady(true)
        let id = getWorkMeIdFromStorage()
        
        if (!id) {
          try {
            const refreshed = await refreshWorkMe()
            if (refreshed) {
              id = refreshed.id
            }
          } catch (error) {
            console.error('Failed to refresh WorkMe:', error)
          }
        }
        
        if (id) {
          setWorkMeId(id)
        } else {
          router.push('/signin')
        }
      } else {
        router.push('/signin')
      }
    })

    return () => unsubscribe()
  }, [router])

  async function handleAIParse() {
    if (!aiText.trim()) {
      alert('Please paste some text to parse')
      return
    }

    try {
      setParsing(true)
      const response = await api.post('/api/platform/unit/living-homage/ai-parse', { text: aiText })

      if (response.data.success && response.data.data) {
        setReviewData(response.data.data)
      } else {
        alert('Failed to parse: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to parse with AI:', error)
      alert('Failed to parse: ' + (error.response?.data?.error || error.message))
    } finally {
      setParsing(false)
    }
  }

  async function handleSubmit() {
    if (!reviewData || !reviewData.fullName) {
      alert('Full name is required')
      return
    }

    try {
      setLoading(true)
      const response = await api.post(`/api/company/products/platform/unit/${unitId}/living-homage`, reviewData)

      if (response.data.success) {
        setSuccess(true)
      } else {
        alert('Failed to save living homage: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to save living homage:', error)
      alert('Failed to save living homage: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  if (!authReady || !workMeId) {
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
          </div>
        </div>
      </nav>

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href={`/mycompany/platforms/${platformId}/units/${unitId}`}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Unit
            </Link>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-6">
                <Heart className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Add Living Homage</h1>
              </div>

              {success ? (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                      <h2 className="text-xl font-semibold text-green-900">Living Homage Saved Successfully!</h2>
                    </div>
                    <div className="flex items-center justify-end space-x-4">
                      <Link
                        href={`/mycompany/platforms/${platformId}/units/${unitId}`}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                      >
                        View Unit
                      </Link>
                    </div>
                  </div>
                </div>
              ) : !reviewData ? (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="aiText" className="block text-sm font-medium text-gray-700 mb-2">
                      Paste Article or Text
                    </label>
                    <textarea
                      id="aiText"
                      rows={12}
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Paste ceremony announcement, press release, or dedication speech about the ship sponsor or living homage..."
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      AI will extract living homage details from your text.
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-4">
                    <Link
                      href={`/mycompany/platforms/${platformId}/units/${unitId}`}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Link>
                    <button
                      onClick={handleAIParse}
                      disabled={parsing || !aiText.trim()}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {parsing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Ingest with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Review the parsed data below. You can edit fields before saving.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={reviewData.fullName}
                        onChange={(e) => setReviewData({ ...reviewData, fullName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <input
                        type="text"
                        value={reviewData.role || ''}
                        onChange={(e) => setReviewData({ ...reviewData, role: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., Ship Sponsor, Memorial Honoree"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                      <input
                        type="text"
                        value={reviewData.relation || ''}
                        onChange={(e) => setReviewData({ ...reviewData, relation: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., Granddaughter-in-law of namesake"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        rows={3}
                        value={reviewData.notes || ''}
                        onChange={(e) => setReviewData({ ...reviewData, notes: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-4">
                    <button
                      onClick={() => {
                        setReviewData(null)
                        setAiText('')
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !reviewData.fullName}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save Living Homage'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
