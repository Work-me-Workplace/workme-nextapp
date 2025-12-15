'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Monitor, ArrowLeft, Package, Archive, Trash2, Loader2, CheckCircle2 } from 'lucide-react'

interface DigitalSignage {
  id: string
  signType: string
  companyUnit?: string | null
  createdAt: string
  workforceAchievement?: {
    headline: string
    subhead?: string | null
    factualStatement?: string | null
    quote?: string | null
    quoteAttribution?: string | null
    runtimeGuidance?: string | null
    imageAsset?: {
      id: string
      url: string
      filename?: string | null
    } | null
  } | null
  workforce?: {
    title: string
    summary?: string | null
    bullets: string[]
    imageUrl?: string | null
    footerNote?: string | null
  } | null
  companyNews?: {
    headline: string
    subheadline?: string | null
    body?: string | null
    link?: string | null
    thumbnail?: string | null
  } | null
  companyEvent?: {
    eventName: string
    eventDate?: string | null
    startTime?: string | null
    endTime?: string | null
    location?: string | null
    description?: string | null
    perks: string[]
    registrationLink?: string | null
  } | null
}

export default function DigitalSignageReviewPage() {
  const router = useRouter()
  const params = useParams()
  const signageId = params?.id as string

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [signage, setSignage] = useState<DigitalSignage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadSignage()
      }
    }
  }, [router, signageId])

  async function loadSignage() {
    if (!signageId) return

    try {
      setLoading(true)
      const response = await api.get(`/api/digital-signage/${signageId}`)
      
      if (response.data.success && response.data.signage) {
        setSignage(response.data.signage)
      } else {
        setError('Failed to load digital signage')
      }
    } catch (error: any) {
      console.error('Failed to load digital signage:', error)
      setError(error.message || 'Failed to load digital signage')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignToDesignPackage() {
    if (!signageId) return

    try {
      setAssigning(true)
      setError(null)
      
      const response = await api.post('/api/mywork/designworkpackage/create', {
        signageId,
        title: `Design work for ${signage?.workforceAchievement?.headline || signage?.workforce?.title || 'Digital Signage'}`,
      })

      if (response.data.success) {
        setSuccess('Assigned to Design Work Package')
        setTimeout(() => {
          router.push('/mywork/products')
        }, 1500)
      } else {
        setError(response.data.error || 'Failed to assign to design package')
      }
    } catch (error: any) {
      console.error('Failed to assign to design package:', error)
      setError(error.response?.data?.error || 'Failed to assign to design package')
    } finally {
      setAssigning(false)
    }
  }

  async function handleArchive() {
    if (!signageId) return

    if (!confirm('Are you sure you want to archive this digital signage? You can unarchive it later.')) {
      return
    }

    try {
      setArchiving(true)
      setError(null)
      
      const response = await api.post(`/api/mywork/digital-signage/${signageId}/archive`)

      if (response.data.success) {
        setSuccess('Archived successfully')
        setTimeout(() => {
          router.push('/mywork/products')
        }, 1500)
      } else {
        setError(response.data.error || 'Failed to archive')
      }
    } catch (error: any) {
      console.error('Failed to archive:', error)
      setError(error.response?.data?.error || 'Failed to archive')
    } finally {
      setArchiving(false)
    }
  }

  async function handleDelete() {
    if (!signageId) return

    if (!confirm('Are you sure you want to delete this digital signage? This action cannot be undone.')) {
      return
    }

    if (!confirm('This will permanently delete the digital signage. Are you absolutely sure?')) {
      return
    }

    try {
      setDeleting(true)
      setError(null)
      
      const response = await api.delete(`/api/digital-signage/${signageId}`)

      if (response.data.success) {
        setSuccess('Deleted successfully')
        setTimeout(() => {
          router.push('/mywork/products')
        }, 1500)
      } else {
        setError(response.data.error || 'Failed to delete')
      }
    } catch (error: any) {
      console.error('Failed to delete:', error)
      setError(error.response?.data?.error || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !signage) {
    return (
      <div className="min-h-screen bg-gray-50">
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
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
                <Link href="/mywork/products" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
                  ← Back to Work Products
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const displayData = signage?.workforceAchievement || signage?.workforce || signage?.companyNews || signage?.companyEvent

  return (
    <div className="min-h-screen bg-gray-50">
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
            <Link
              href="/mywork/products"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Work Products
            </Link>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Monitor className="h-8 w-8 text-purple-600 mr-4" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Review Digital Signage</h1>
                    <p className="text-sm text-gray-600 mt-1">Review and take action on this product</p>
                  </div>
                </div>
              </div>

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-800">{success}</p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Preview */}
              {signage && (
                <div className="border border-gray-200 rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
                  
                  {signage.workforceAchievement?.imageAsset && (
                    <div className="mb-4">
                      <img
                        src={signage.workforceAchievement.imageAsset.url}
                        alt={signage.workforceAchievement.imageAsset.filename || 'Preview'}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Headline:</span>
                      <p className="text-gray-900">
                        {signage.workforceAchievement?.headline || 
                         signage.workforce?.title || 
                         signage.companyNews?.headline || 
                         signage.companyEvent?.eventName}
                      </p>
                    </div>
                    {(signage.workforceAchievement?.subhead || signage.workforce?.summary || signage.companyNews?.subheadline) && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Subhead:</span>
                        <p className="text-gray-900">
                          {signage.workforceAchievement?.subhead || 
                           signage.workforce?.summary || 
                           signage.companyNews?.subheadline}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500">Type:</span>
                      <p className="text-gray-900">{signage.signType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Created:</span>
                      <p className="text-gray-900">{new Date(signage.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleAssignToDesignPackage}
                  disabled={assigning || archiving || deleting}
                  className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Package className="h-5 w-5 mr-2" />
                      Assign to Design Work Package
                    </>
                  )}
                </button>

                <button
                  onClick={handleArchive}
                  disabled={assigning || archiving || deleting}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {archiving ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Archiving...
                    </>
                  ) : (
                    <>
                      <Archive className="h-5 w-5 mr-2" />
                      Archive
                    </>
                  )}
                </button>

                <button
                  onClick={handleDelete}
                  disabled={assigning || archiving || deleting}
                  className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5 mr-2" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
