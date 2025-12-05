'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Calendar, Filter, Archive, Clock, CheckCircle, Users, AlertCircle } from 'lucide-react'
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
  const [companyUnitId, setCompanyUnitId] = useState<string | null>(null)
  const [items, setItems] = useState<WorkforceStuffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'active' | 'archived' | 'all'>('active')

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
          // Get companyUnitId from localStorage (set by welcome/dashboard)
          const storedCompanyUnitId = localStorage.getItem('companyUnit')
          if (storedCompanyUnitId) {
            setCompanyUnitId(storedCompanyUnitId)
          } else {
            // If not in localStorage, try to get from WorkMe profile
            loadCompanyUnitId(id)
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

  // Load companyUnitId from WorkMe profile if not in localStorage
  async function loadCompanyUnitId(workMeId: string) {
    try {
      const response = await api.get('/api/workme/profile')
      if (response.data.success && response.data.workMe?.companyUnitId) {
        const unitId = response.data.workMe.companyUnitId
        setCompanyUnitId(unitId)
        localStorage.setItem('companyUnit', unitId)
      }
    } catch (error) {
      console.error('Failed to load companyUnitId:', error)
    }
  }

  // Load items only when auth is ready and companyUnitId is available
  useEffect(() => {
    if (authReady && workMeId && companyUnitId) {
      loadItems()
    }
  }, [authReady, workMeId, companyUnitId])

  async function loadItems() {
    if (!companyUnitId) {
      console.warn('Cannot load items: companyUnitId not set')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Pass companyUnitId as query parameter
      const response = await api.get(`/api/workforcestuff?companyUnitId=${encodeURIComponent(companyUnitId)}`)
      
      if (response.data.success && response.data.items) {
        setItems(response.data.items)
      } else {
        console.error('Failed to load items:', response.data.error)
        setItems([])
      }
    } catch (error) {
      console.error('Failed to load workforce stuff:', error)
      setItems([])
    } finally {
      setLoading(false)
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

  if (!authReady || !workMeId || !companyUnitId || loading) {
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
              <Link
                href="/mycompany/workforcestuff/ingest"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ingest Content
              </Link>
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
                        <Link
                          key={item.id}
                          href={detailRoute}
                          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-green-500"
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
                      <Link
                        key={item.id}
                        href={detailRoute}
                        className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-gray-300 opacity-75"
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
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredItems.length === 0 && (
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
          </div>
        </main>
      </div>
    </div>
  )
}

