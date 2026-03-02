'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/providers/AuthProvider'
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
  Pencil,
  CalendarClock,
  Loader2,
  Layers,
  Circle,
} from 'lucide-react'
import api from '@/lib/api'
import { WorkOpsStatus, WorkOpsItemType, WorkOpsUrgency, WorkOpsCategory } from '@prisma/client'

const ITEM_TYPE_OPTIONS: { value: WorkOpsItemType; label: string }[] = [
  { value: WorkOpsItemType.task, label: 'Task' },
  { value: WorkOpsItemType.capture, label: 'Capture' },
  { value: WorkOpsItemType.meeting, label: 'Meeting' },
  { value: WorkOpsItemType.signal, label: 'Signal' },
  { value: WorkOpsItemType.boss_request, label: 'Boss request' },
  { value: WorkOpsItemType.tech_work, label: 'Tech work' },
  { value: WorkOpsItemType.admin, label: 'Admin' },
  { value: WorkOpsItemType.workforce_comms, label: 'Workforce comms' },
  { value: WorkOpsItemType.external_pressure, label: 'External pressure' },
  { value: WorkOpsItemType.personal, label: 'Personal' },
]

const URGENCY_OPTIONS: { value: WorkOpsUrgency; label: string }[] = [
  { value: WorkOpsUrgency.low, label: 'Low' },
  { value: WorkOpsUrgency.medium, label: 'Medium' },
  { value: WorkOpsUrgency.high, label: 'High' },
  { value: WorkOpsUrgency.critical, label: 'Critical' },
]

const CATEGORY_OPTIONS: { value: WorkOpsCategory; label: string }[] = [
  { value: WorkOpsCategory.product, label: 'Product' },
  { value: WorkOpsCategory.planning, label: 'Planning' },
  { value: WorkOpsCategory.bossrequest, label: 'Boss Request' },
  { value: WorkOpsCategory.emergent, label: 'Emergent' },
  { value: WorkOpsCategory.companyevent, label: 'Company Event' },
]

interface WorkOpsItem {
  id: string
  title: string
  body?: string | null
  itemType: string
  urgency?: string | null
  category?: string | null
  status: WorkOpsStatus
  source?: string | null
  dueDate?: string | null
  createdAt: string
  updatedAt: string
}

/** WorkOpsItem plus optional last day it was assigned (for "from all previous days") */
type WorkOpsItemWithLastDay = WorkOpsItem & { lastAssignedDay?: string }

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
  const { session } = useAuth()
  const workMeId = session.workMeId
  const [outlookId, setOutlookId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [assignments, setAssignments] = useState<DailyAssignment[]>([])
  const [unassignedItems, setUnassignedItems] = useState<WorkOpsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [showUnassigned, setShowUnassigned] = useState(false)
  const [showFromPreviousDay, setShowFromPreviousDay] = useState(false)
  const [previousDayAssignments, setPreviousDayAssignments] = useState<DailyAssignment[]>([])
  const [showUncompletedFromPast, setShowUncompletedFromPast] = useState(false)
  const [uncompletedFromPastItems, setUncompletedFromPastItems] = useState<WorkOpsItemWithLastDay[]>([])
  const [editItem, setEditItem] = useState<WorkOpsItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editItemType, setEditItemType] = useState<WorkOpsItemType>(WorkOpsItemType.task)
  const [editUrgency, setEditUrgency] = useState<WorkOpsUrgency | ''>('')
  const [editCategory, setEditCategory] = useState<WorkOpsCategory | ''>('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [quickAddText, setQuickAddText] = useState('')
  const [quickAddLoading, setQuickAddLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [bringAllForwardLoading, setBringAllForwardLoading] = useState(false)
  const [bringAllUncompletedForwardLoading, setBringAllUncompletedForwardLoading] = useState(false)

  const clearError = () => setErrorMessage(null)
  const getApiError = (err: any) =>
    err?.response?.data?.error || err?.message || 'Something went wrong. Please try again.'

  useEffect(() => {
    if (!workMeId) {
      router.push('/signin')
      return
    }
    loadOutlook(workMeId)
  }, [workMeId, router])

  const handleAutoCarryover = async () => {
    if (!outlookId) return
    clearError()
    try {
      const dayStr = selectedDate.toISOString().split('T')[0]
      const res = await api.post('/api/workops/daily-assignments/auto-carryover', {
        day: dayStr,
      })
      if (res.data.success && res.data.carriedOver > 0) {
        // Reload assignments to show carried-over tasks
        await loadDailyAssignments()
        await loadUnassignedItems()
        if (showUncompletedFromPast) await loadUncompletedFromPast()
        // Show subtle notification (optional - could be a toast)
        console.log(`Auto-carried over ${res.data.carriedOver} tasks`)
      }
    } catch (error: any) {
      // Silently fail - don't show error for auto-carryover
      console.error('Auto-carryover failed:', error)
    }
  }

  useEffect(() => {
    if (outlookId && selectedDate) {
      loadDailyAssignments()
      loadUnassignedItems()
      // Auto-carryover when viewing today
      if (isToday(selectedDate)) {
        handleAutoCarryover()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlookId, selectedDate])

  useEffect(() => {
    if (outlookId && selectedDate && showFromPreviousDay) {
      loadPreviousDayAssignments()
    }
  }, [outlookId, selectedDate, showFromPreviousDay])

  useEffect(() => {
    if (outlookId && selectedDate && showUncompletedFromPast) {
      loadUncompletedFromPast()
    }
  }, [outlookId, selectedDate, showUncompletedFromPast])

  async function loadOutlook(workMeId: string) {
    try {
      setLoading(true)
      const response = await api.get('/api/workops/outlook')
      if (response.data.success && response.data.outlook) {
        setOutlookId(response.data.outlook.id)
      }
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Failed to load daily assignments:', error)
      setErrorMessage(getApiError(error))
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
    } catch (error: any) {
      console.error('Failed to load unassigned items:', error)
      setErrorMessage(getApiError(error))
    }
  }

  async function loadPreviousDayAssignments() {
    if (!outlookId || !selectedDate) return
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    const dayStr = prev.toISOString().split('T')[0]
    try {
      const response = await api.get(
        `/api/workops/daily-assignments?day=${dayStr}`
      )
      if (response.data.success) {
        setPreviousDayAssignments(response.data.assignments || [])
      }
    } catch (error: any) {
      console.error('Failed to load previous day assignments:', error)
      setErrorMessage(getApiError(error))
    }
  }

  async function loadUncompletedFromPast() {
    if (!outlookId || !selectedDate) return
    const beforeStr = selectedDate.toISOString().split('T')[0]
    try {
      const response = await api.get(
        `/api/workops/daily-assignments?uncompletedPast=true&before=${beforeStr}`
      )
      if (response.data.success) {
        setUncompletedFromPastItems(response.data.items || [])
      }
    } catch (error: any) {
      console.error('Failed to load uncompleted from past:', error)
      setErrorMessage(getApiError(error))
    }
  }

  const handleAssignItem = async (itemId: string) => {
    if (!outlookId) return
    clearError()
    try {
      const dayStr = selectedDate.toISOString()
      await api.post('/api/workops/daily-assignments', {
        itemId,
        day: dayStr,
      })
      await loadDailyAssignments()
      await loadUnassignedItems()
      if (showUncompletedFromPast) await loadUncompletedFromPast()
    } catch (error: any) {
      console.error('Failed to assign item:', error)
      setErrorMessage(getApiError(error))
    }
  }

  const handleBringAllForward = async () => {
    if (!outlookId || previousDayAssignments.length === 0) return
    clearError()
    setBringAllForwardLoading(true)
    const dayStr = selectedDate.toISOString()
    const itemIds = previousDayAssignments.map((a) => a.item.id)
    try {
      const res = await api.post('/api/workops/daily-assignments/bulk', {
        itemIds,
        day: dayStr,
      })
      const failed = res.data?.failed ?? []
      await loadDailyAssignments()
      await loadUnassignedItems()
      await loadPreviousDayAssignments()
      if (showUncompletedFromPast) await loadUncompletedFromPast()
      if (failed.length > 0) {
        setErrorMessage(`Assigned most tasks. Failed for: ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? ` and ${failed.length - 3} more` : ''}.`)
      }
    } catch (error: any) {
      console.error('Bring all forward failed:', error)
      setErrorMessage(getApiError(error))
    } finally {
      setBringAllForwardLoading(false)
    }
  }

  const handleBringAllUncompletedForward = async () => {
    if (!outlookId || uncompletedFromPastItems.length === 0) return
    clearError()
    setBringAllUncompletedForwardLoading(true)
    const dayStr = selectedDate.toISOString()
    const itemIds = uncompletedFromPastItems.map((item) => item.id)
    try {
      const res = await api.post('/api/workops/daily-assignments/bulk', {
        itemIds,
        day: dayStr,
      })
      const failed = res.data?.failed ?? []
      await loadDailyAssignments()
      await loadUnassignedItems()
      await loadUncompletedFromPast()
      if (failed.length > 0) {
        setErrorMessage(`Assigned most. Failed for: ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? ` and ${failed.length - 3} more` : ''}.`)
      }
    } catch (error: any) {
      console.error('Bring all uncompleted forward failed:', error)
      setErrorMessage(getApiError(error))
    } finally {
      setBringAllUncompletedForwardLoading(false)
    }
  }

  const handleUnassignItem = async (assignmentId: string) => {
    clearError()
    try {
      await api.delete(`/api/workops/daily-assignments/${assignmentId}`)
      await loadDailyAssignments()
      await loadUnassignedItems()
    } catch (error: any) {
      console.error('Failed to unassign item:', error)
      setErrorMessage(getApiError(error))
    }
  }

  const handleToggleComplete = async (item: WorkOpsItem) => {
    clearError()
    const nextStatus = item.status === WorkOpsStatus.done ? WorkOpsStatus.open : WorkOpsStatus.done
    try {
      await api.patch(`/api/workops/item/${item.id}`, { status: nextStatus })
      await loadDailyAssignments()
      await loadUnassignedItems()
      if (showFromPreviousDay) await loadPreviousDayAssignments()
      if (showUncompletedFromPast) await loadUncompletedFromPast()
    } catch (error: any) {
      console.error('Failed to update status:', error)
      setErrorMessage(getApiError(error))
    }
  }

  const openEdit = (item: WorkOpsItem) => {
    setEditItem(item)
    setEditTitle(item.title)
    setEditBody(item.body || '')
    setEditItemType(item.itemType as WorkOpsItemType)
    setEditUrgency((item.urgency as WorkOpsUrgency) || '')
    setEditCategory((item.category as WorkOpsCategory) || '')
  }

  const closeEdit = () => {
    setEditItem(null)
    setEditCategory('')
  }

  const saveEdit = async () => {
    if (!editItem || !editTitle.trim()) return
    setSavingEdit(true)
    clearError()
    try {
      await api.patch(`/api/workops/item/${editItem.id}`, {
        title: editTitle.trim(),
        body: editBody.trim() || null,
        itemType: editItemType,
        urgency: editUrgency || null,
        category: editCategory || null,
      })
      closeEdit()
      await loadDailyAssignments()
      await loadUnassignedItems()
    } catch (error: any) {
      console.error('Failed to update item:', error)
      setErrorMessage(getApiError(error))
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this task from your backlog? This cannot be undone.')) return
    clearError()
    try {
      await api.delete(`/api/workops/item/${itemId}`)
      await loadDailyAssignments()
      await loadUnassignedItems()
    } catch (error: any) {
      console.error('Failed to delete item:', error)
      setErrorMessage(getApiError(error))
    }
  }

  const handleQuickAdd = async () => {
    const title = quickAddText.trim()
    if (!title || quickAddLoading) return
    setQuickAddLoading(true)
    clearError()
    try {
      await api.post('/api/workops/item/create', {
        title,
        body: null,
        itemType: 'task',
        source: 'manual',
        urgency: null,
      })
      setQuickAddText('')
      await loadDailyAssignments()
      await loadUnassignedItems()
      setShowUnassigned(true)
    } catch (error: any) {
      console.error('Quick add failed:', error)
      setErrorMessage(getApiError(error))
    } finally {
      setQuickAddLoading(false)
    }
  }

  const handleSuccess = () => {
    if (workMeId) {
      loadOutlook(workMeId)
      loadDailyAssignments()
      loadUnassignedItems()
      router.refresh()
      // Auto-show backlog after creating a new task so user can quickly assign it
      setShowUnassigned(true)
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

  const getCategoryColor = (category?: string | null) => {
    switch (category) {
      case 'product':
        return 'bg-blue-100 text-blue-800'
      case 'planning':
        return 'bg-purple-100 text-purple-800'
      case 'bossrequest':
        return 'bg-pink-100 text-pink-800'
      case 'emergent':
        return 'bg-red-100 text-red-800'
      case 'companyevent':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!workMeId || loading) {
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

          {/* Error banner */}
          {errorMessage && (
            <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
              <p className="text-sm font-medium">{errorMessage}</p>
              <button
                onClick={clearError}
                className="shrink-0 rounded p-1 hover:bg-red-100 transition"
                aria-label="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

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

          {/* Quick add one-liner */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
              placeholder="Add a task (one line, press Enter)"
              className="flex-1 max-w-xl px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleQuickAdd}
              disabled={!quickAddText.trim() || quickAddLoading}
              className="px-4 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {quickAddLoading ? '…' : 'Add'}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add task
            </button>
            <button
              onClick={() => setShowUnassigned(!showUnassigned)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              <List className="h-5 w-5 mr-2" />
              {showUnassigned ? 'Hide unassigned' : 'Show unassigned'}
            </button>
            <button
              onClick={() => {
                setShowFromPreviousDay(!showFromPreviousDay)
                if (!showFromPreviousDay) loadPreviousDayAssignments()
              }}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              <CalendarClock className="h-5 w-5 mr-2" />
              {showFromPreviousDay ? 'Hide from previous day' : 'From previous day'}
            </button>
            <button
              onClick={() => {
                setShowUncompletedFromPast(!showUncompletedFromPast)
                if (!showUncompletedFromPast) loadUncompletedFromPast()
              }}
              className="flex items-center px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-medium hover:bg-amber-100 transition"
            >
              <Layers className="h-5 w-5 mr-2" />
              {showUncompletedFromPast ? 'Hide uncompleted work' : 'From all previous days'}
            </button>
          </div>

          {/* Uncompleted from all previous days — hydrate today with past incomplete work */}
          {showUncompletedFromPast && (
            <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    From all previous days ({uncompletedFromPastItems.length})
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Uncompleted tasks from any past day — add to {isToday(selectedDate) ? 'today' : 'this day'} or bring all forward
                  </p>
                </div>
                {uncompletedFromPastItems.length > 0 && (
                  <button
                    onClick={handleBringAllUncompletedForward}
                    disabled={bringAllUncompletedForwardLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bringAllUncompletedForwardLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Bringing forward…
                      </>
                    ) : (
                      'Bring all forward'
                    )}
                  </button>
                )}
              </div>
              {uncompletedFromPastItems.length > 0 ? (
                <div className="space-y-2">
                  {uncompletedFromPastItems.map((item) => {
                    const isDone = item.status === WorkOpsStatus.done
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg hover:bg-amber-50 transition border border-amber-100"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(item)}
                            className="flex-shrink-0 p-0.5 rounded-full hover:bg-black/5"
                            aria-label={isDone ? 'Mark not complete' : 'Mark complete'}
                            title={isDone ? 'Mark not complete' : 'Mark complete — won’t show in uncompleted list'}
                          >
                            {isDone ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400 hover:text-green-600" />
                            )}
                          </button>
                          <div className="flex-1">
                            <h4 className={`font-medium ${isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {item.title}
                            </h4>
                            {item.body && (
                              <p className={`text-sm mt-1 ${isDone ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                {item.body}
                              </p>
                            )}
                            {item.lastAssignedDay && (
                              <p className="text-xs text-amber-700 mt-1">
                                Last scheduled: {new Date(item.lastAssignedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          {item.category && (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(
                                item.category
                              )}`}
                            >
                              {item.category}
                            </span>
                          )}
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
                        <div className="ml-4 flex items-center gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
                            aria-label="Edit task"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleAssignItem(item.id)}
                            className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition"
                          >
                            Add to Day
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No uncompleted work from previous days.</p>
              )}
            </div>
          )}

          {/* From previous day — carry over tasks */}
          {showFromPreviousDay && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    From previous day ({previousDayAssignments.length})
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Tasks from {formatDate((() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); return d })())} — add any to {isToday(selectedDate) ? 'today' : 'this day'} or bring all forward
                  </p>
                </div>
                {previousDayAssignments.length > 0 && (
                  <button
                    onClick={handleBringAllForward}
                    disabled={bringAllForwardLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bringAllForwardLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Bringing forward…
                      </>
                    ) : (
                      'Bring all forward'
                    )}
                  </button>
                )}
              </div>
              {previousDayAssignments.length > 0 ? (
                <div className="space-y-2">
                  {previousDayAssignments.map((assignment) => {
                    const isDone = assignment.item.status === WorkOpsStatus.done
                    return (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(assignment.item)}
                            className="flex-shrink-0 p-0.5 rounded-full hover:bg-black/5"
                            aria-label={isDone ? 'Mark not complete' : 'Mark complete'}
                            title={isDone ? 'Mark not complete' : 'Mark complete'}
                          >
                            {isDone ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400 hover:text-green-600" />
                            )}
                          </button>
                          <div className="flex-1">
                            <h4 className={`font-medium ${isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {assignment.item.title}
                            </h4>
                            {assignment.item.body && (
                              <p className={`text-sm mt-1 ${isDone ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                {assignment.item.body}
                              </p>
                            )}
                          </div>
                          {assignment.item.urgency && (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${getUrgencyColor(
                                assignment.item.urgency
                              )}`}
                            >
                              {assignment.item.urgency}
                            </span>
                          )}
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <button
                            onClick={() => openEdit(assignment.item)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
                            aria-label="Edit task"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleAssignItem(assignment.item.id)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                          >
                            Add to Day
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No tasks were assigned to the previous day.</p>
              )}
            </div>
          )}

          {/* Unassigned — tasks not yet scheduled to a day */}
          {showUnassigned && unassignedItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Unassigned ({unassignedItems.length})
              </h3>
              <p className="text-sm text-gray-500 mb-4">Tasks not yet scheduled to a day. Type & urgency: edit with the pencil.</p>
              <div className="space-y-2">
                {unassignedItems.map((item) => {
                  const isDone = item.status === WorkOpsStatus.done
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition ${
                        isDone ? 'bg-green-50/50' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(item)}
                          className="flex-shrink-0 p-0.5 rounded-full hover:bg-black/5"
                          aria-label={isDone ? 'Mark not complete' : 'Mark complete'}
                          title={isDone ? 'Mark not complete' : 'Mark complete'}
                        >
                          {isDone ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 hover:text-green-600" />
                          )}
                        </button>
                        <div className="flex-1">
                          <h4 className={`font-medium ${isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {item.title}
                          </h4>
                          {item.body && (
                            <p className={`text-sm mt-1 ${isDone ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                              {item.body}
                            </p>
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
                      <div className="ml-4 flex items-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
                          aria-label="Edit task"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          aria-label="Delete from backlog"
                          title="Delete from backlog"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAssignItem(item.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                        >
                          Add to Day
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Daily Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Tasks for {formatDate(selectedDate)} ({assignments.length})
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Click the circle to mark complete (done tasks won’t come forward). Type & urgency: edit with the pencil.</p>
              </div>
            </div>

            {assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const isDone = assignment.item.status === WorkOpsStatus.done
                  return (
                    <div
                      key={assignment.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border transition border-gray-200 ${
                        isDone ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(assignment.item)}
                        className="flex-shrink-0 mt-0.5 p-0.5 rounded-full hover:bg-black/5 transition"
                        aria-label={isDone ? 'Mark not complete' : 'Mark complete'}
                        title={isDone ? 'Mark not complete' : 'Mark complete'}
                      >
                        {isDone ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <Circle className="h-6 w-6 text-gray-400 hover:text-green-600" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`font-semibold mb-1 ${
                            isDone ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}
                        >
                          {assignment.item.title}
                        </h4>
                        {assignment.item.body && (
                          <p className={`text-sm mb-2 ${isDone ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                            {assignment.item.body}
                          </p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                            {assignment.item.itemType}
                          </span>
                          {assignment.item.category && (
                            <span
                              className={`text-xs px-2 py-1 rounded font-medium ${getCategoryColor(
                                assignment.item.category
                              )}`}
                            >
                              {assignment.item.category}
                            </span>
                          )}
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
                            {assignment.item.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => openEdit(assignment.item)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
                          aria-label="Edit task"
                          title="Edit task"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleUnassignItem(assignment.id)}
                          className="flex items-center gap-1.5 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition text-sm"
                          aria-label="Remove from day"
                          title="Remove from day"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Remove from day</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No tasks assigned
                </h3>
                <p className="text-gray-600 mb-4">
                  Add a task (manual or AI), pull from backlog, carry over from yesterday, or hydrate from all uncompleted past work.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    Add task
                  </button>
                  <button
                    onClick={() => setShowUnassigned(true)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    From backlog
                  </button>
                  <button
                    onClick={() => {
                      setShowFromPreviousDay(true)
                      loadPreviousDayAssignments()
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    From previous day
                  </button>
                  <button
                    onClick={() => {
                      setShowUncompletedFromPast(true)
                      loadUncompletedFromPast()
                    }}
                    className="px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-medium hover:bg-amber-100 transition"
                  >
                    From all previous days
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

      {/* Edit task modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit task</h3>
              <button
                onClick={closeEdit}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={editItemType}
                    onChange={(e) => setEditItemType(e.target.value as WorkOpsItemType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {ITEM_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory((e.target.value || '') as WorkOpsCategory | '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                  <select
                    value={editUrgency}
                    onChange={(e) => setEditUrgency((e.target.value || '') as WorkOpsUrgency | '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {URGENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeEdit}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit || !editTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

