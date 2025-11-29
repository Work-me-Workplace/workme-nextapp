'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Loader2, ArrowRight } from 'lucide-react'

interface TrainingModel {
  title: string | null
  description: string | null
  mandatory: boolean
  topic: string | null
  sponsoringOffice: string | null
  trainingDate: string | null
  startTime: string | null
  endTime: string | null
  location: string | null
  format: 'in-person' | 'virtual' | 'hybrid' | null
  link: string | null
  poc: {
    name: string | null
    email: string | null
    phone: string | null
    rankOrTitle: string | null
  }
}

export default function TrainingIngestPage() {
  const router = useRouter()
  const params = useParams()
  const trainingId = params.trainingId as string

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true) // Start with true to wait for auth
  const [saving, setSaving] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [formData, setFormData] = useState<TrainingModel>({
    title: null,
    description: null,
    mandatory: false,
    topic: null,
    sponsoringOffice: null,
    trainingDate: null,
    startTime: null,
    endTime: null,
    location: null,
    format: null,
    link: null,
    poc: {
      name: null,
      email: null,
      phone: null,
      rankOrTitle: null,
    },
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Wait for Firebase auth to be ready
    if (!auth) {
      console.error('Firebase auth not initialized - redirecting to signin')
      router.push('/signin')
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.error('No Firebase user - redirecting to signin')
        router.push('/signin')
        return
      }

      // Firebase auth is ready, now check workMeId
      const id = getWorkMeIdFromStorage()
      if (!id) {
        console.error('No workMeId in storage - redirecting to signin')
        router.push('/signin')
        return
      }

      setWorkMeId(id)
      setAuthReady(true)
      
      // Now that auth is ready, load and hydrate
      await loadAndHydrate(id)
    })

    return () => unsubscribe()
  }, [router, trainingId])

  async function loadAndHydrate(id: string) {
    try {
      setLoading(true)
      const { default: api } = await import('@/lib/api')

      // Hydrate training model
      const response = await api.post('/api/workstuff/ingest/training-hydrate', {
        trainingId,
      })

      if (response.data.success && response.data.model) {
        setFormData(response.data.model)
      } else {
        alert('Failed to hydrate: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Hydrate error:', error)
      alert('Failed to hydrate training')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!workMeId || !formData.title) {
      alert('Please fill in at least the title')
      return
    }

    setSaving(true)
    try {
      const { default: api } = await import('@/lib/api')

      const response = await api.post('/api/workstuff/ingest/training-save', {
        trainingId,
        ...formData,
      })

      if (response.data.success) {
        alert('Training saved successfully!')
        router.push(`/mycompany/workforcestuff`)
      } else {
        alert('Failed to save: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save training')
    } finally {
      setSaving(false)
    }
  }

  if (!workMeId || !authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading training data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Workforce Stuff
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Training Ingest</h1>
          <p className="text-gray-600 mt-2">Review and edit the training details</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Training title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Training description"
              />
            </div>

            {/* Mandatory */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.mandatory}
                  onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Mandatory Training</span>
              </label>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic
              </label>
              <input
                type="text"
                value={formData.topic || ''}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Training topic"
              />
            </div>

            {/* Sponsoring Office */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sponsoring Office
              </label>
              <input
                type="text"
                value={formData.sponsoringOffice || ''}
                onChange={(e) => setFormData({ ...formData, sponsoringOffice: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Sponsoring office"
              />
            </div>

            {/* Date / Time */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Training Date
                </label>
                <input
                  type="date"
                  value={formData.trainingDate || ''}
                  onChange={(e) => setFormData({ ...formData, trainingDate: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime || ''}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime || ''}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Training location"
              />
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <select
                value={formData.format || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    format: (e.target.value as 'in-person' | 'virtual' | 'hybrid') || null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select format</option>
                <option value="in-person">In-Person</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link
              </label>
              <input
                type="url"
                value={formData.link || ''}
                onChange={(e) => setFormData({ ...formData, link: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Registration or livestream link"
              />
            </div>

            {/* POC */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Point of Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rank/Title</label>
                  <input
                    type="text"
                    value={formData.poc.rankOrTitle || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        poc: { ...formData.poc, rankOrTitle: e.target.value || null },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mr., Ms., CDR, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.poc.name || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        poc: { ...formData.poc, name: e.target.value || null },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.poc.email || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        poc: { ...formData.poc, email: e.target.value || null },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.poc.phone || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        poc: { ...formData.poc, phone: e.target.value || null },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex gap-4">
            <button
              onClick={() => router.push('/mycompany/workforcestuff')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.title}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Training
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

