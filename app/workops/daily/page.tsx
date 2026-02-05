'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import AddWorkModal from '@/components/workops/add-work/AddWorkModal'
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  List,
  Trash2,
} from 'lucide-react'
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
}

interface DailyAssignment {
  id: string
  itemId: string
  day: string
  dayIndex?: number | null
  createdAt: string
  item: WorkOpsItem
}

export default function DailyOutlookPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [outlookId, setOutlookId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [assignments, setAssignments] = useState<DailyAssignment[]>([])
  const [unassignedItems, setUnassignedItems] = useState<WorkOpsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [showAddFromBacklog, setShowAddFromBacklog] = useState(false)

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

  useEffect(() => {
    if (outlookId && selectedDate) {
      loadDailyAssignments()
      loadUnassignedItems()
    }
  }, [outlookId, selectedDate])

  async function loadOutlook(workMeId: string) {
    try {
      setLoading(true)
      const response = await api.get('/api/workops/outlook')

      if (response.data.success && response.data.outlook) {
        setOutlookId(response.data.outlook.id)
      }
    } catch (error) {
      console.error('Failed to load outlook:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadDailyAssignments() {
    if (!outlookId) return

    try {
      const dayStr = selectedDate.toISOString().split('T')[0]
      const response = await api.get(
        `/api/workops/daily-assignments?day=${dayStr}`
      )

      if (response.data.success) {
        setAssignments(response.data.assignments || [])
      }
    } catch (error) {
      console.error('Failed to load daily assignments:', error)
    }
  }

  async function loadUnassignedItems() {
    if (!outlookId) return

    try {
      const response = await api.get(
        `/api/workops/daily-assignments?unassigned=true`
      )

      if (response.data.success) {
        setUnassignedItems(response.data.items || [])
      }
    } catch (error) {
      console.error('Failed to load unassigned items:', error)
    }
  }

  const handleAssignItem = async (itemId: string) => {
    if (!outlookId) return

    try {
      const dayStr = selectedDate.toISOString()
      await api.post('/api/workops/daily-assignments', {
        itemId,
        day: dayStr,
      })

      await loadDailyAssignments()
      await loadUnassignedItems()
    } catch (error) {
      console.error('Failed to assign item:', error)
      alert('Failed to assign item. Please try again.')
    }
  }

  const handleUnassignItem = async (assignmentId: string) => {
    try {
      await api.delete(`/api/workops/daily-assignments/${assignmentId}`)
      await loadDailyAssignments()
      await loadUnassignedItems()
    } catch (error) {
      console.error('Failed to unassign item:', error)
      alert('Failed to remove item. Please try again.')
    }
  }

  const handleSuccess = () => {
    if (workMeId) {
      loadOutlook(workMeId)
      loadDailyAssignments()
      loadUnassignedItems()
      router.refresh()
      // Auto-show backlog after creating a new task so user can quickly assign it
      setShowAddFromBacklog(true)
    }
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
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

  if (!authReady || !workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarNav />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Daily Outlook</h1>
            <p className="text-gray-600 mt-2">Plan and manage your daily tasks</p>
          </div>

          {/* Date Selector */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => changeDate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  aria-label="Previous day"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {formatDate(selectedDate)}
                  </h2>
                  {isToday(selectedDate) && (
                    <span className="text-sm text-blue-600 font-medium">Today</span>
                  )}
                </div>
                <button
                  onClick={() => changeDate(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  aria-label="Next day"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Go to Today
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Task
            </button>
            <button
              onClick={() => setShowAddFromBacklog(!showAddFromBacklog)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              <List className="h-5 w-5 mr-2" />
              {showAddFromBacklog ? 'Hide' : 'Add from'} Backlog
            </button>
          </div>

          {/* Unassigned Items (when showing backlog) */}
          {showAddFromBacklog && unassignedItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Unassigned Items ({unassignedItems.length})
              </h3>
              <div className="space-y-2">
                {unassignedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(item.status)}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        {item.body && (
                          <p className="text-sm text-gray-600 mt-1">{item.body}</p>
                        )}
                      </div>
                      {item.urgency && (
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getUrgencyColor(
                            item.urgency
                          )}`}
                        >
                          {item.urgency}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAssignItem(item.id)}
                      className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                      Add to Day
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Tasks for {formatDate(selectedDate)} ({assignments.length})
              </h3>
            </div>

            {assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(assignment.item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {assignment.item.title}
                      </h4>
                      {assignment.item.body && (
                        <p className="text-sm text-gray-600 mb-2">
                          {assignment.item.body}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                          {assignment.item.itemType}
                        </span>
                        {assignment.item.urgency && (
                          <span
                            className={`text-xs px-2 py-1 rounded font-medium ${getUrgencyColor(
                              assignment.item.urgency
                            )}`}
                          >
                            {assignment.item.urgency}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          Status: {assignment.item.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnassignItem(assignment.id)}
                      className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      aria-label="Remove from day"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No tasks assigned
                </h3>
                <p className="text-gray-600 mb-4">
                  Add tasks from your backlog or create new ones for this day.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowAddFromBacklog(true)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    Add from Backlog
                  </button>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    Create New Task
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

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

