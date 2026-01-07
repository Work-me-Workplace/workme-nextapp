'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { getWorkMe } from '@/lib/workme.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Calendar, Filter, Archive, ArchiveRestore, Clock, CheckCircle, Users, AlertCircle, Building2 } from 'lucide-react'
import api from '@/lib/api'

// Unified WorkforceStuffItem type
interface WorkforceStuffItem {
  id: string
  type: 'event' | 'training' | 'benefit' | 'campaign' | 'impact' | 'cause' | 'community' | 'announcement'
  category: string
  title: string
  summary: string
  startDate?: string | null
  endDate?: string | null
  status: 'active' | 'archived'
  createdAt: string
  // Training-specific fields
  topic?: string | null
  mandatory?: boolean
  location?: string | null
  format?: string | null
  link?: string | null
  poc?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
    rankOrTitle?: string | null
  }
  ingestStatus?: string | null
  raw?: any
}

export default function WorkforceStuffPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [items, setItems] = useState<WorkforceStuffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const [companyIdLoading, setCompanyIdLoading] = useState(false)
  const [companyIdNotFound, setCompanyIdNotFound] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'active' | 'archived' | 'all'>('active')
  const [archiving, setArchiving] = useState<Set<string>>(new Set())

  // Wait for auth to be ready before loading data
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check Firebase auth
    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthReady(true)
        const id = getWorkMeIdFromStorage()
        if (id) {
          setWorkMeId(id)
          // Try multiple sources for companyId:
          // 1. Direct localStorage key (set by refreshWorkMe)
          // 2. From stored WorkMe object in localStorage
          // 3. Legacy companyUnit key (backward compat)
          // 4. API call if none found
          const directCompanyId = localStorage.getItem('companyId')
          const storedWorkMe = getWorkMe()
          const workMeCompanyId = storedWorkMe?.companyId
          const legacyCompanyUnit = localStorage.getItem('companyUnit')
          
          const companyIdValue = directCompanyId || workMeCompanyId || legacyCompanyUnit
          
          if (companyIdValue) {
            setCompanyId(companyIdValue)
            // Ensure it's saved to localStorage for future use
            if (!directCompanyId && companyIdValue) {
              localStorage.setItem('companyId', companyIdValue)
            }
            setCompanyIdNotFound(false)
            setCompanyIdLoading(false)
            // Don't set loading to false here - let loadItems() handle it
          } else {
            // If not in localStorage, try to get from WorkMe API
            setCompanyIdLoading(true)
            setLoading(true)
            loadCompanyId(id)
          }
        } else {
          router.push('/signin')
        }
      } else {
        router.push('/signin')
      }
    })

    return () => unsubscribe()
  }, [router])

  // Load companyId from WorkMe profile if not in localStorage
  async function loadCompanyId(workMeId: string) {
    try {
      const response = await api.get('/api/workme/me')
      if (response.data.success && response.data.workMe?.companyId) {
        const id = response.data.workMe.companyId
        setCompanyId(id)
        localStorage.setItem('companyId', id)
        // Also set for backward compat if needed
        localStorage.setItem('companyUnit', id)
        setCompanyIdNotFound(false)
      } else {
        // No companyId found - user needs to add company
        setCompanyIdNotFound(true)
      }
    } catch (error) {
      console.error('Failed to load companyId:', error)
      setCompanyIdNotFound(true)
    } finally {
      setCompanyIdLoading(false)
      setLoading(false)
    }
  }

  // Load items only when auth is ready and companyId is available
  useEffect(() => {
    if (authReady && workMeId && companyId) {
      loadItems()
    }
  }, [authReady, workMeId, companyId])

  async function loadItems(forceRefresh = false) {
    if (!companyId) {
      console.warn('Cannot load items: companyId not set')
      setLoading(false)
      return
    }

    const cacheKey = `workforcestuff_${companyId}`
    const cacheTimestampKey = `workforcestuff_${companyId}_timestamp`

    try {
      // Try localStorage first (instant load) unless forcing refresh
      if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey)
        const cachedTimestamp = localStorage.getItem(cacheTimestampKey)
        
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            setItems(parsed)
            setLoading(false)
            
            // Check if cache is stale (older than 5 minutes)
            const now = Date.now()
            const timestamp = cachedTimestamp ? parseInt(cachedTimestamp, 10) : 0
            const fiveMinutes = 5 * 60 * 1000
            const isStale = (now - timestamp) > fiveMinutes
            
            // Refresh in background if stale or just refresh silently
            refreshFromAPI(cacheKey, cacheTimestampKey, false)
            return
          } catch (e) {
            console.warn('Failed to parse cached items:', e)
            // Fall through to API fetch
          }
        }
      }

      // If not in localStorage or forcing refresh, fetch from API
      await refreshFromAPI(cacheKey, cacheTimestampKey, true)
    } catch (error) {
      console.error('Failed to load workforce stuff:', error)
      setItems([])
      setLoading(false)
    } finally {
      // Ensure loading is always set to false
      setLoading(false)
    }
  }

  async function refreshFromAPI(cacheKey: string, cacheTimestampKey: string, showLoading: boolean) {
    if (!companyId) {
      if (showLoading) {
        setLoading(false)
      }
      return
    }

    try {
      if (showLoading) {
        setLoading(true)
      }
      
      // Pass companyId as query parameter
      const response = await api.get(`/api/workforcestuff?companyId=${encodeURIComponent(companyId)}`)
      
      if (response.data.success && response.data.items) {
        setItems(response.data.items)
        
        // Store in localStorage for next time
        localStorage.setItem(cacheKey, JSON.stringify(response.data.items))
        localStorage.setItem(cacheTimestampKey, Date.now().toString())
      } else {
        console.error('Failed to load items:', response.data?.error || 'Unknown error')
        setItems([])
      }
    } catch (error: any) {
      console.error('Failed to fetch workforce stuff from API:', error)
      // Don't clear items if we have cached data and this was a background refresh
      if (showLoading) {
        setItems([])
      }
      // Log the error details for debugging
      if (error.response) {
        console.error('API Error Response:', error.response.data)
      }
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  async function handleArchive(itemId: string, itemType: string, archived: boolean) {
    if (archiving.has(itemId)) return

    try {
      setArchiving(new Set(archiving).add(itemId))
      
      const response = await api.put(`/api/workforcestuff/${itemId}`, {
        type: itemType,
        data: { status: archived ? 'ARCHIVED' : 'ACTIVE' },
      })

      if (response.data.success) {
        // Refresh items
        await loadItems(true)
      } else {
        alert(response.data.error || 'Failed to archive item')
      }
    } catch (err: any) {
      console.error('Failed to archive item:', err)
      alert(err.response?.data?.error || err.message || 'Failed to archive item')
    } finally {
      const newArchiving = new Set(archiving)
      newArchiving.delete(itemId)
      setArchiving(newArchiving)
    }
  }

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'event', label: 'Events' },
    { value: 'training', label: 'Training' },
    { value: 'benefit', label: 'Benefits' },
    { value: 'campaign', label: 'Campaigns' },
    { value: 'impact', label: 'Impact Events' },
    { value: 'cause', label: 'Causes' },
    { value: 'community', label: 'Community' },
    { value: 'announcement', label: 'Announcements' },
  ]

  const filteredItems = items.filter(item => {
    const categoryMatch = filterCategory === 'all' || item.type === filterCategory
    const statusMatch = filterStatus === 'all' || item.status === filterStatus
    return categoryMatch && statusMatch
  })

  // Status filtering logic
  const now = new Date()
  
  const activeItems = filteredItems.filter(item => {
    // If explicitly archived, exclude from active
    if (item.status === 'archived') return false
    
    // For training items: include if ingestStatus is pending or saved, or if trainingDate is today/future
    if (item.type === 'training') {
      // Include pending/hydrated trainings
      if (item.ingestStatus === 'pending' || item.ingestStatus === 'saved') {
        // If trainingDate exists, check if it's today or future
        if (item.startDate) {
          const trainingDate = new Date(item.startDate)
          return trainingDate >= new Date(now.setHours(0, 0, 0, 0))
        }
        // If no date, include if status is pending/saved
        return true
      }
      // If trainingDate exists and is future, include
      if (item.startDate) {
        const trainingDate = new Date(item.startDate)
        return trainingDate >= new Date(now.setHours(0, 0, 0, 0))
      }
      return false
    }
    
    // For other items: use endDate logic
    if (item.endDate) {
      const endDate = new Date(item.endDate)
      return endDate >= now
    }
    return true
  })

  const archivedItems = filteredItems.filter(item => {
    // Explicitly archived
    if (item.status === 'archived') return true
    
    // For training items: archive if trainingDate is in the past
    if (item.type === 'training' && item.startDate) {
      const trainingDate = new Date(item.startDate)
      return trainingDate < new Date(now.setHours(0, 0, 0, 0))
    }
    
    // For other items: archive if endDate is in the past
    if (item.endDate) {
      const endDate = new Date(item.endDate)
      return endDate < now
    }
    
    return false
  })

  // Show loading spinner while auth is initializing or companyId is being loaded
  if (!authReady || !workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show loading spinner only while actively loading companyId from API
  if (companyIdLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company information...</p>
        </div>
      </div>
    )
  }

  // Show "add company info" button when companyId is not found (soft fallback)
  if (companyIdNotFound || !companyId) {
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-lg shadow p-12 text-center max-w-2xl mx-auto">
                <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Company Setup Required</h3>
                <p className="text-gray-600 mb-2 text-lg">
                  To view workforce content, we need to know which company you're with.
                </p>
                <p className="text-gray-500 mb-8">
                  This helps us show you relevant events, training sessions, announcements, and other company activities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/settings/company"
                    className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
                  >
                    <Building2 className="h-5 w-5 mr-2" />
                    Add Your Company
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
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
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Workforce Stuff</h1>
                <p className="text-gray-600 mt-2">All internal happenings and company activities</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/mycompany/workforcestuff/add"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </Link>
                <Link
                  href="/mycompany/workforcestuff/ingest"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center gap-2"
                >
                  Ingest Content
                </Link>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {categoryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'active' | 'archived' | 'all')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active Now</option>
                  <option value="archived">Archived</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            {/* Active Now Section */}
            {filterStatus === 'active' || filterStatus === 'all' ? (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Clock className="h-5 w-5 text-green-600 mr-2" />
                    Active Now
                  </h2>
                  <span className="text-sm text-gray-500">{activeItems.length} items</span>
                </div>
                {activeItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeItems.map(item => {
                      // Determine the correct detail page route
                      const detailRoute = item.type === 'training' 
                        ? `/mycompany/workforcestuff/training/${item.id}`
                        : `/mycompany/workforcestuff/${item.id}`
                      
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-green-500 relative group"
                        >
                          <Link
                            href={detailRoute}
                            className="block"
                          >
                            <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 uppercase bg-green-100 text-green-800 px-2 py-1 rounded">
                                {item.type}
                              </span>
                              {item.type === 'training' && item.mandatory && (
                                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                                  Mandatory
                                </span>
                              )}
                              {item.type === 'training' && item.ingestStatus === 'pending' && (
                                <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                                  Pending
                                </span>
                              )}
                            </div>
                            {(() => {
                              const date = item.endDate || item.startDate
                              if (date) {
                                const dateObj = new Date(date)
                                const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                if (dateObj <= weekFromNow) {
                                  return <span className="text-xs font-medium text-orange-600">Due Soon</span>
                                }
                              }
                              return null
                            })()}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                          {item.type === 'training' && item.topic && (
                            <p className="text-xs text-blue-600 mb-2">Topic: {item.topic}</p>
                          )}
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.summary}</p>
                          <div className="space-y-1">
                            {item.startDate && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                {item.type === 'training' ? 'Training Date' : 'Starts'} {new Date(item.startDate).toLocaleDateString()}
                              </div>
                            )}
                            {item.type === 'training' && item.location && (
                              <div className="text-xs text-gray-500">
                                📍 {item.location}
                              </div>
                            )}
                            {item.type === 'training' && item.format && (
                              <div className="text-xs text-gray-500">
                                Format: {item.format}
                              </div>
                            )}
                          </div>
                          </Link>
                          {/* Archive button - appears on hover */}
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                handleArchive(item.id, item.type, true)
                              }}
                              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                              title="Archive item"
                            >
                              <Archive className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No active workforce items</p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Archived Section */}
            {(filterStatus === 'archived' || filterStatus === 'all') && archivedItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Archive className="h-5 w-5 text-gray-400 mr-2" />
                    Archived
                  </h2>
                  <span className="text-sm text-gray-500">{archivedItems.length} items</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {archivedItems.map(item => {
                    const detailRoute = item.type === 'training' 
                      ? `/mycompany/workforcestuff/training/${item.id}`
                      : `/mycompany/workforcestuff/${item.id}`
                    
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-gray-300 opacity-75 relative group"
                      >
                        <Link
                          href={detailRoute}
                          className="block"
                        >
                          <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            {item.type}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.summary}</p>
                        {item.startDate && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(item.startDate).toLocaleDateString()}
                            </div>
                          )}
                        </Link>
                        {/* Unarchive button - appears on hover */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleArchive(item.id, item.type, false)
                            }}
                            className="p-2 bg-gray-100 hover:bg-green-100 rounded-full transition"
                            title="Unarchive item"
                          >
                            <ArchiveRestore className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty State - only show when not loading and truly no items */}
            {!loading && filteredItems.length === 0 && items.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Workforce Stuff</h3>
                <p className="text-gray-600 mb-4">Start by creating events, training, or other company happenings.</p>
                <Link
                  href="/mywork"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Create Workforce Item
                </Link>
              </div>
            )}

            {/* Loading State */}
            {loading && items.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading workforce items...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

