'use client'

import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Calendar, FileText, Plus, Archive, Edit, ArchiveRestore, Save, X } from 'lucide-react'
import api from '@/lib/api'

interface WorkforceStuffItem {
  id: string
  type: 'event' | 'training' | 'benefit' | 'campaign' | 'impact' | 'cause' | 'community' | 'announcement' | 'career'
  title: string
  summary?: string
  description?: string
  details?: string
  startDate?: string | null
  endDate?: string | null
  status?: 'active' | 'archived'
  archived?: boolean
  createdAt: string
  [key: string]: any // For additional fields
}

export default function WorkforceStuffDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const itemId = params?.id as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [item, setItem] = useState<WorkforceStuffItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        if (itemId) {
          loadItem()
        }
      }
    }
  }, [router, itemId])

  useEffect(() => {
    const editParam = searchParams?.get('edit')
    if (editParam === '1') {
      setIsEditing(true)
    }
  }, [searchParams])

  async function loadItem() {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/workforcestuff/${itemId}`)
      
      if (response.data.success && response.data.item) {
        const loadedItem = response.data.item
        const isArchived = loadedItem.status === 'ARCHIVED' || loadedItem.archived
        const normalized = {
          ...loadedItem,
          status: isArchived ? 'archived' : 'active',
          archived: isArchived,
        }
        setItem(normalized)
        setFormData(buildInitialForm(normalized))
      } else {
        setError('Item not found')
      }
    } catch (err: any) {
      console.error('Failed to load workforce stuff item:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load item')
    } finally {
      setLoading(false)
    }
  }

  async function handleArchive(archived: boolean) {
    if (!item) return

    try {
      setArchiving(true)
      setError(null)
      
      const response = await api.put(`/api/workforcestuff/${itemId}`, {
        type: item.type,
        data: { status: archived ? 'ARCHIVED' : 'ACTIVE' },
      })

      if (response.data.success) {
        // Reload the item to reflect the change
        await loadItem()
        // Also refresh the list by redirecting back
        router.push('/mycompany/workforcestuff')
      } else {
        setError(response.data.error || 'Failed to archive item')
      }
    } catch (err: any) {
      console.error('Failed to archive item:', err)
      setError(err.response?.data?.error || err.message || 'Failed to archive item')
    } finally {
      setArchiving(false)
    }
  }

  function toDateInput(value?: string | null) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 10)
  }

  function buildInitialForm(source: WorkforceStuffItem) {
    const base = {
      title: source.title || '',
      description: source.description || source.summary || '',
      startDate: toDateInput(source.startDate),
      endDate: toDateInput(source.endDate),
      location: source.location || '',
      link: source.link || source.ctaLink || source.actionLink || source.registrationLink || '',
      topic: source.topic || '',
      mandatory: source.mandatory || false,
      sponsoringOffice: source.sponsoringOffice || '',
      format: source.format || '',
      startTime: source.startTime || '',
      endTime: source.endTime || '',
      impactedPopulation: source.impactedPopulation || '',
      urgency: source.urgency || '',
      sponsor: source.sponsor || '',
      employeeBenefitSummary: source.employeeBenefitSummary || '',
      partnerOrg: source.partnerOrg || '',
      impactSummary: source.impactSummary || '',
      level: source.level || '',
      type: source.type || '',
      pocFirstName: source.pocFirstName || '',
      pocLastName: source.pocLastName || '',
      pocEmail: source.pocEmail || '',
      pocPhone: source.pocPhone || '',
      pocRankOrTitle: source.pocRankOrTitle || '',
    }

    return base
  }

  function buildUpdateData(source: WorkforceStuffItem, data: Record<string, any>) {
    switch (source.type) {
      case 'training':
        return {
          title: data.title || null,
          description: data.description || null,
          topic: data.topic || null,
          mandatory: !!data.mandatory,
          sponsoringOffice: data.sponsoringOffice || null,
          trainingDate: data.startDate ? new Date(data.startDate) : null,
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          location: data.location || null,
          format: data.format || null,
          link: data.link || null,
          pocFirstName: data.pocFirstName || null,
          pocLastName: data.pocLastName || null,
          pocEmail: data.pocEmail || null,
          pocPhone: data.pocPhone || null,
          pocRankOrTitle: data.pocRankOrTitle || null,
        }
      case 'event':
        return {
          title: data.title || null,
          description: data.description || null,
          eventDate: data.startDate ? new Date(data.startDate) : null,
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          location: data.location || null,
          registrationLink: data.link || null,
          pocEmail: data.pocEmail || null,
          pocPhone: data.pocPhone || null,
        }
      case 'campaign':
        return {
          title: data.title || null,
          description: data.description || null,
          windowStart: data.startDate ? new Date(data.startDate) : null,
          windowEnd: data.endDate ? new Date(data.endDate) : null,
          ctaLink: data.link || null,
          sponsor: data.sponsor || null,
        }
      case 'impact':
        return {
          title: data.title || null,
          description: data.description || null,
          effectiveDate: data.startDate ? new Date(data.startDate) : null,
          impactedPopulation: data.impactedPopulation || null,
          urgency: data.urgency || null,
          pocFirstName: data.pocFirstName || null,
          pocLastName: data.pocLastName || null,
          pocEmail: data.pocEmail || null,
          pocPhone: data.pocPhone || null,
        }
      case 'community':
        return {
          title: data.title || null,
          description: data.description || null,
          date: data.startDate ? new Date(data.startDate) : null,
          location: data.location || null,
          signUpLink: data.link || null,
          pocFirstName: data.pocFirstName || null,
          pocLastName: data.pocLastName || null,
          pocEmail: data.pocEmail || null,
          pocPhone: data.pocPhone || null,
        }
      case 'benefit':
        return {
          title: data.title || null,
          description: data.description || null,
          employeeBenefitSummary: data.employeeBenefitSummary || null,
          windowStart: data.startDate ? new Date(data.startDate) : null,
          windowEnd: data.endDate ? new Date(data.endDate) : null,
          actionLink: data.link || null,
        }
      case 'career':
        return {
          title: data.title || null,
          description: data.description || null,
          level: data.level || null,
          type: data.type || null,
        }
      case 'cause':
        return {
          title: data.title || null,
          description: data.description || null,
          impactSummary: data.impactSummary || null,
          partnerOrg: data.partnerOrg || null,
          windowStart: data.startDate ? new Date(data.startDate) : null,
          windowEnd: data.endDate ? new Date(data.endDate) : null,
          link: data.link || null,
          sponsoringDepartment: data.sponsoringDepartment || null,
        }
      default:
        return {
          title: data.title || null,
          description: data.description || null,
        }
    }
  }

  async function handleSave() {
    if (!item) return

    try {
      setSaving(true)
      setError(null)
      const updateData = buildUpdateData(item, formData)
      const response = await api.put(`/api/workforcestuff/${itemId}`, {
        type: item.type,
        data: updateData,
      })

      if (!response.data.success) {
        setError(response.data.error || 'Failed to update item')
        return
      }

      await loadItem()
      setIsEditing(false)
    } catch (err: any) {
      console.error('Failed to update item:', err)
      setError(err.response?.data?.error || err.message || 'Failed to update item')
    } finally {
      setSaving(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!loading && !item && !error) {
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
              <div className="bg-white rounded-lg shadow p-12 text-center">
                {error ? (
                  <>
                    <p className="text-red-600 mb-4 font-semibold">{error}</p>
                    <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700">
                      ← Back to Workforce Stuff
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-4">Workforce item not found</p>
                    <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700">
                      ← Back to Workforce Stuff
                    </Link>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!item) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
              ← Back to Workforce Stuff
            </Link>

            <div className="bg-white rounded-lg shadow p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase bg-blue-100 text-blue-800 px-2 py-1 rounded mb-2 inline-block">
                    {item.type}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900 mt-2">{item.title}</h1>
                  {(item.summary || item.description) && (
                    <p className="text-gray-600 mt-2">{item.summary || item.description}</p>
                  )}
                  {item.archived && (
                    <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                      Archived
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-3 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                  )}
                  {isEditing && (
                    <>
                      <button
                        onClick={() => {
                          setFormData(buildInitialForm(item))
                          setIsEditing(false)
                        }}
                        className="inline-flex items-center px-3 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Date Information */}
              {(item.startDate || item.endDate) && !isEditing && (
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  {item.startDate && (
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Start Date</p>
                        <p className="font-semibold text-gray-900">{new Date(item.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  {item.endDate && (
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">End Date</p>
                        <p className="font-semibold text-gray-900">{new Date(item.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Details */}
              {(item.details || item.description) && !isEditing && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Details</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{item.details || item.description}</p>
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  {(item.type === 'training' || item.type === 'event') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {item.type === 'training' ? 'Training Date' : 'Event Date'}
                        </label>
                        <input
                          type="date"
                          value={formData.startDate || ''}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          value={formData.location || ''}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {(item.type === 'campaign' || item.type === 'benefit' || item.type === 'cause') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input
                          type="date"
                          value={formData.startDate || ''}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input
                          type="date"
                          value={formData.endDate || ''}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {item.type === 'impact' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
                        <input
                          type="date"
                          value={formData.startDate || ''}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Impacted Population</label>
                        <input
                          type="text"
                          value={formData.impactedPopulation || ''}
                          onChange={(e) => setFormData({ ...formData, impactedPopulation: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                        <select
                          value={formData.urgency || ''}
                          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Select urgency</option>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {(item.type === 'campaign' || item.type === 'benefit' || item.type === 'community' || item.type === 'cause') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Link</label>
                      <input
                        type="url"
                        value={formData.link || ''}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}

                  {(item.type === 'training' || item.type === 'event') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                        <input
                          type="time"
                          value={formData.startTime || ''}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                        <input
                          type="time"
                          value={formData.endTime || ''}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-6 border-t">
                <Link
                  href={`/mywork/products?sourceId=${item.id}&sourceType=${item.type}`}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Products from This
                </Link>
                <Link
                  href={`/mywork/products?sourceId=${item.id}`}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  View Related Outputs
                </Link>
                {item.archived ? (
                  <button
                    onClick={() => handleArchive(false)}
                    disabled={archiving}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <ArchiveRestore className="h-5 w-5 mr-2" />
                    {archiving ? 'Unarchiving...' : 'Unarchive'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleArchive(true)}
                    disabled={archiving}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Archive className="h-5 w-5 mr-2" />
                    {archiving ? 'Archiving...' : 'Archive'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

