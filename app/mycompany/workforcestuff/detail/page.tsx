'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, Suspense } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { Calendar, FileText, Plus, Archive, Edit, ArchiveRestore, Save, X, Trash2 } from 'lucide-react'
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
  [key: string]: any
}

const STORAGE_KEY = 'workforce_detail_item'

function WorkforceStuffDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams?.get('companyId') || ''
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [item, setItem] = useState<WorkforceStuffItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [archiving, setArchiving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      setWorkMeId(id)
    }
  }, [router])

  useEffect(() => {
    if (!companyId) return
    loadItemByCompany()
  }, [companyId])

  const selectedItemId = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      const parsed = JSON.parse(stored)
      return parsed?.id || null
    } catch {
      return null
    }
  }, [])

  async function loadItemByCompany() {
    try {
      setLoading(true)
      setError(null)

      if (!companyId) {
        setError('companyId is required')
        return
      }

      if (!selectedItemId) {
        setError('No item selected')
        return
      }

      const response = await api.get(`/api/workforcestuff?companyId=${encodeURIComponent(companyId)}`)
      if (!response.data.success || !response.data.items) {
        setError('Failed to load workforce items')
        return
      }

      const found = response.data.items.find((it: WorkforceStuffItem) => it.id === selectedItemId)
      if (!found) {
        setError('Item not found')
        return
      }

      const isArchived = found.status === 'ARCHIVED' || found.archived
      const normalized = {
        ...found,
        status: isArchived ? 'archived' : 'active',
        archived: isArchived,
      }

      setItem(normalized)
      setFormData(buildInitialForm(normalized))
    } catch (err: any) {
      console.error('Failed to load item by company:', err)
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

      const response = await api.put(`/api/workforcestuff/${item.id}`, {
        type: item.type,
        data: { status: archived ? 'ARCHIVED' : 'ACTIVE' },
      })

      if (response.data.success) {
        await loadItemByCompany()
        router.push(`/mycompany/workforcestuff`)
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

  async function handleDelete() {
    if (!item) return
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      setError(null)

      const response = await api.delete(`/api/workforcestuff/${item.id}?type=${item.type}`)

      if (response.data.success) {
        router.push(`/mycompany/workforcestuff?companyId=${encodeURIComponent(companyId)}`)
      } else {
        setError(response.data.error || 'Failed to delete item')
      }
    } catch (err: any) {
      console.error('Failed to delete item:', err)
      setError(err.response?.data?.error || err.message || 'Failed to delete item')
    } finally {
      setDeleting(false)
    }
  }

  function toDateInput(value?: string | null) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 10)
  }

  function buildInitialForm(source: WorkforceStuffItem) {
    // Simplified form for impact events - just the essentials
    if (source.type === 'impact') {
      return {
        title: source.title || '',
        description: source.description || source.summary || '',
        effectiveDate: toDateInput(source.startDate || source.effectiveDate),
        impactedPopulation: source.impactedPopulation || '',
        urgency: source.urgency || '',
      }
    }

    // Full form for other types
    return {
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
        // Simplified impact event model - only core fields
        return {
          title: data.title || null,
          description: data.description || null,
          summary: data.description || null, // Use description as summary
          effectiveDate: (data.effectiveDate || data.startDate) ? new Date(data.effectiveDate || data.startDate) : null,
          impactedPopulation: data.impactedPopulation || null,
          urgency: data.urgency || null,
          // Explicitly set POC fields to null to clear them if they exist
          pocFirstName: null,
          pocLastName: null,
          pocEmail: null,
          pocPhone: null,
          location: null,
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
      const response = await api.put(`/api/workforcestuff/${item.id}`, {
        type: item.type,
        data: updateData,
      })

      if (!response.data.success) {
        setError(response.data.error || 'Failed to update item')
        return
      }

      await loadItemByCompany()
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

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center space-x-2">
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
                <p className="text-gray-500 mb-4">{error || 'Workforce item not found'}</p>
                <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700">
                  ← Back to Workforce Stuff
                </Link>
              </div>
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

              {!isEditing && item.type === 'impact' && (
                <div className="mb-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                  {item.startDate && (
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Effective Date</p>
                        <p className="font-semibold text-gray-900">{new Date(item.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  {item.impactedPopulation && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Who It Affects</p>
                      <p className="font-semibold text-gray-900">{item.impactedPopulation}</p>
                    </div>
                  )}
                  {item.urgency && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Urgency</p>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                        {item.urgency}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {(item.startDate || item.endDate) && !isEditing && item.type !== 'impact' && (
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
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
                        <input
                          type="date"
                          value={formData.effectiveDate || formData.startDate || ''}
                          onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Who It Affects</label>
                        <input
                          type="text"
                          value={formData.impactedPopulation || ''}
                          onChange={(e) => setFormData({ ...formData, impactedPopulation: e.target.value })}
                          placeholder="e.g., All D.C. area employees, Remote workers, etc."
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

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-6 border-t">
                <Link
                  href={`/mywork/create?sourceId=${item.id}&sourceType=${item.type}`}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Work Output
                </Link>
                <Link
                  href={`/mywork/products?sourceId=${item.id}`}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  <FileText className="h-5 w-5 mr-2" />
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
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function WorkforceStuffDetailByCompanyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <WorkforceStuffDetailContent />
    </Suspense>
  )
}

