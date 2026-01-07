'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import AddWorkModal from '@/components/workops/add-work/AddWorkModal'
import WhiteboardView from '@/components/workops/WhiteboardView'
import { Plus, Clock, CheckCircle, AlertCircle, XCircle, LayoutGrid, List, Download, Upload, BarChart3, FileText, Filter, Sparkles, Settings } from 'lucide-react'
import api from '@/lib/api'
import { WorkOpsStatus } from '@prisma/client'

interface WorkOpsItem {
  id: string
  title: string
  body?: string | null
  itemType: string
  urgency?: string | null
  status: WorkOpsStatus
  source?: string | null
  dueDate?: string | null
  createdAt: string
  updatedAt: string
  positionX?: number | null
  positionY?: number | null
  groupId?: string | null
  targetQuarter?: string | null
}

type ViewMode = 'list' | 'whiteboard'

export default function OverallOutlookPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [outlookId, setOutlookId] = useState<string | null>(null)
  const [items, setItems] = useState<WorkOpsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('whiteboard')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthReady(true)
        const id = getWorkMeIdFromStorage()
        if (id) {
          setWorkMeId(id)
          loadOutlook(id)
        } else {
          router.push('/signin')
        }
      } else {
        router.push('/signin')
      }
    })

    return () => unsubscribe()
  }, [router])

  async function loadOutlook(workMeId: string) {
    try {
      setLoading(true)
      const response = await api.get('/api/workops/outlook')
      
      if (response.data.success && response.data.outlook) {
        setOutlookId(response.data.outlook.id)
        setItems(response.data.outlook.items || [])
      }
    } catch (error) {
      console.error('Failed to load outlook:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    if (workMeId) {
      loadOutlook(workMeId)
      router.refresh()
    }
  }

  const handleItemUpdate = async (itemId: string, updates: Partial<WorkOpsItem>) => {
    try {
      // Update local state optimistically
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
      )

      // Update on server
      await api.patch(`/api/workops/item/${itemId}`, updates)
    } catch (error) {
      console.error('Failed to update item:', error)
      // Reload on error to revert optimistic update
      if (workMeId) {
        loadOutlook(workMeId)
      }
    }
  }

  const getStatusIcon = (status: WorkOpsStatus) => {
    switch (status) {
      case WorkOpsStatus.done:
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case WorkOpsStatus.in_progress:
        return <Clock className="h-5 w-5 text-blue-600" />
      case WorkOpsStatus.blocked:
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getUrgencyColor = (urgency?: string | null) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleComingSoon = (featureName: string) => {
    alert(`${featureName} coming soon!`)
  }

  if (!authReady || !workMeId || loading) {
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

        <main className="flex-1 flex flex-col">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Overall Outlook</h1>
                <p className="text-gray-600 mt-2">
                  {viewMode === 'whiteboard' 
                    ? 'Strategic planning whiteboard - organize your goals and work for 2026'
                    : 'Your complete work backlog and active items'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('whiteboard')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                      viewMode === 'whiteboard'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Whiteboard
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                      viewMode === 'list'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    List
                  </button>
                </div>
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Work
                </button>
              </div>
            </div>

            {/* Coming Soon Features Toolbar */}
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Quick Actions</h2>
                <span className="text-xs text-gray-500">Features in development</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                <button
                  onClick={() => handleComingSoon('Export Work')}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition group"
                >
                  <Download className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">Export</span>
                  <span className="text-[10px] text-gray-400">Coming Soon</span>
                </button>
                <button
                  onClick={() => handleComingSoon('Import Work')}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition group"
                >
                  <Upload className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">Import</span>
                  <span className="text-[10px] text-gray-400">Coming Soon</span>
                </button>
                <button
                  onClick={() => handleComingSoon('Analytics & Reports')}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition group"
                >
                  <BarChart3 className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">Analytics</span>
                  <span className="text-[10px] text-gray-400">Coming Soon</span>
                </button>
                <button
                  onClick={() => handleComingSoon('Work Templates')}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition group"
                >
                  <FileText className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">Templates</span>
                  <span className="text-[10px] text-gray-400">Coming Soon</span>
                </button>
                <button
                  onClick={() => handleComingSoon('Advanced Filters')}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition group"
                >
                  <Filter className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">Filters</span>
                  <span className="text-[10px] text-gray-400">Coming Soon</span>
                </button>
                <button
                  onClick={() => handleComingSoon('AI Insights')}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition group"
                >
                  <Sparkles className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">AI Insights</span>
                  <span className="text-[10px] text-gray-400">Coming Soon</span>
                </button>
                <button
                  onClick={() => handleComingSoon('Settings')}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition group"
                >
                  <Settings className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">Settings</span>
                  <span className="text-[10px] text-gray-400">Coming Soon</span>
                </button>
              </div>
            </div>

            {viewMode === 'whiteboard' ? (
              <div className="h-[calc(100vh-250px)] w-full">
                {items.length > 0 || true ? (
                  <WhiteboardView
                    items={items}
                    onItemUpdate={handleItemUpdate}
                    onAddGoal={() => {
                      // TODO: Implement goal creation modal
                      alert('Goal creation coming soon!')
                    }}
                    onAddItem={() => setModalOpen(true)}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow p-12 text-center h-full flex items-center justify-center">
                    <div>
                      <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Work Items</h3>
                      <p className="text-gray-600 mb-4">Start by adding work items to your outlook.</p>
                      <button
                        onClick={() => setModalOpen(true)}
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        Add Your First Work Item
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {items.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            {getStatusIcon(item.status)}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                              {item.body && (
                                <p className="text-sm text-gray-600 mt-1">{item.body}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.urgency && (
                              <span className={`px-2 py-1 text-xs font-medium rounded ${getUrgencyColor(item.urgency)}`}>
                                {item.urgency}
                              </span>
                            )}
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {item.itemType}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-4">
                          <span>Status: {item.status}</span>
                          {item.dueDate && (
                            <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                          )}
                          <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Work Items</h3>
                    <p className="text-gray-600 mb-4">Start by adding work items to your outlook.</p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Add Your First Work Item
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {outlookId && (
        <AddWorkModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
          outlookId={outlookId}
        />
      )}
    </div>
  )
}
