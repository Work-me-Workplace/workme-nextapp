'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Loader2, ArrowRight, Plus, X } from 'lucide-react'
import api from '@/lib/api'

interface CareerModel {
  title: string | null
  description: string | null
  level: 'NAVSEA' | 'NAVY' | 'DOD' | null
  type: 'Leadership' | 'Fellowship' | 'Other' | null
  eligibility: {
    paygradeRange: { min: string | null; max: string | null }
    timeInServiceMonths: number | null
    timeInPositionMonths: number | null
    who: string | null
  }
  application: {
    instructions: string | null
    link: string | null
  }
  extras: {
    cost: string | null
    notes: string[] | null
  }
}

export default function CareerIngestPage() {
  const router = useRouter()
  const params = useParams()
  const careerId = params.careerId as string

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [formData, setFormData] = useState<CareerModel>({
    title: null,
    description: null,
    level: null,
    type: null,
    eligibility: {
      paygradeRange: { min: null, max: null },
      timeInServiceMonths: null,
      timeInPositionMonths: null,
      who: null,
    },
    application: {
      instructions: null,
      link: null,
    },
    extras: {
      cost: null,
      notes: null,
    },
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

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

      const id = getWorkMeIdFromStorage()
      if (!id) {
        console.error('No workMeId in storage - redirecting to signin')
        router.push('/signin')
        return
      }

      setWorkMeId(id)
      setAuthReady(true)
      await loadAndHydrate(id)
    })

    return () => unsubscribe()
  }, [router, careerId])

  async function loadAndHydrate(id: string) {
    try {
      setLoading(true)
      const response = await api.post('/api/workstuff/ingest/career-hydrate', {
        careerId,
      })

      if (response.data.success && response.data.model) {
        setFormData(response.data.model)
      } else {
        alert('Failed to hydrate: ' + (response.data.error || 'Unknown error'))
        router.push('/mycompany/workforcestuff/ingest')
      }
    } catch (error) {
      console.error('Hydrate error:', error)
      alert('Failed to hydrate career')
      router.push('/mycompany/workforcestuff/ingest')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    if (!field || typeof field !== 'string') return
    
    if (field.startsWith('eligibility.')) {
      const subField = field.split('.')[1]
      if (subField === 'paygradeRange.min' || subField === 'paygradeRange.max') {
        const rangeField = subField.split('.')[1]
        setFormData((prev) => ({
          ...prev,
          eligibility: {
            ...prev.eligibility,
            paygradeRange: {
              ...prev.eligibility.paygradeRange,
              [rangeField]: value || null,
            },
          },
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          eligibility: {
            ...prev.eligibility,
            [subField]: value || null,
          },
        }))
      }
    } else if (field.startsWith('application.')) {
      const subField = field.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        application: {
          ...prev.application,
          [subField]: value || null,
        },
      }))
    } else if (field.startsWith('extras.')) {
      const subField = field.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        extras: {
          ...prev.extras,
          [subField]: value || null,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value || null,
      }))
    }
  }

  const addNote = () => {
    setFormData((prev) => ({
      ...prev,
      extras: {
        ...prev.extras,
        notes: [...(prev.extras.notes || []), ''],
      },
    }))
  }

  const removeNote = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      extras: {
        ...prev.extras,
        notes: prev.extras.notes?.filter((_, i) => i !== index) || null,
      },
    }))
  }

  const updateNote = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      extras: {
        ...prev.extras,
        notes: prev.extras.notes?.map((note, i) => (i === index ? value : note)) || null,
      },
    }))
  }

  const handleSave = async () => {
    if (!workMeId || !formData.title) {
      alert('Please fill in at least the title')
      return
    }

    setSaving(true)
    try {
      const response = await api.post('/api/workstuff/ingest/career-save', {
        careerId,
        ...formData,
      })

      if (response.data.success) {
        alert('Career saved successfully!')
        router.push(`/mycompany/workforcestuff/career/${careerId}`)
      } else {
        alert('Failed to save: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save career')
    } finally {
      setSaving(false)
    }
  }

  if (!authReady || !workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-700">Loading career data...</span>
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
          <h1 className="text-3xl font-bold text-gray-900">Career Ingest</h1>
          <p className="text-gray-600 mt-2">Review and edit the career opportunity details</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="space-y-8">
            {/* SECTION: Core */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Core</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Career opportunity title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Career opportunity description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                    <select
                      value={formData.level || ''}
                      onChange={(e) => handleChange('level', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select level</option>
                      <option value="NAVSEA">NAVSEA</option>
                      <option value="NAVY">NAVY</option>
                      <option value="DOD">DOD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={formData.type || ''}
                      onChange={(e) => handleChange('type', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="Leadership">Leadership</option>
                      <option value="Fellowship">Fellowship</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION: Eligibility */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Eligibility</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Paygrade Min</label>
                    <input
                      type="text"
                      value={formData.eligibility.paygradeRange.min || ''}
                      onChange={(e) => handleChange('eligibility.paygradeRange.min', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., GS-13"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Paygrade Max</label>
                    <input
                      type="text"
                      value={formData.eligibility.paygradeRange.max || ''}
                      onChange={(e) => handleChange('eligibility.paygradeRange.max', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., GS-15"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time In Service (months)</label>
                    <input
                      type="number"
                      value={formData.eligibility.timeInServiceMonths || ''}
                      onChange={(e) => handleChange('eligibility.timeInServiceMonths', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Months"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time In Position (months)</label>
                    <input
                      type="number"
                      value={formData.eligibility.timeInPositionMonths || ''}
                      onChange={(e) => handleChange('eligibility.timeInPositionMonths', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Months"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Who (summary)</label>
                  <textarea
                    value={formData.eligibility.who || ''}
                    onChange={(e) => handleChange('eligibility.who', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Summary of who is eligible"
                  />
                </div>
              </div>
            </div>

            {/* SECTION: Application */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Application</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                  <textarea
                    value={formData.application.instructions || ''}
                    onChange={(e) => handleChange('application.instructions', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Application instructions"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link</label>
                  <input
                    type="url"
                    value={formData.application.link || ''}
                    onChange={(e) => handleChange('application.link', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Application URL"
                  />
                </div>
              </div>
            </div>

            {/* SECTION: Extras */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Extras (Optional)</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cost</label>
                  <input
                    type="text"
                    value={formData.extras.cost || ''}
                    onChange={(e) => handleChange('extras.cost', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., NAVSEA units fund travel/lodging"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <button
                      type="button"
                      onClick={addNote}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Note
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.extras.notes?.map((note, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => updateNote(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Note"
                        />
                        <button
                          type="button"
                          onClick={() => removeNote(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
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
                  Save Career
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

