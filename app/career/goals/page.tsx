'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { Plus, Edit2, Trash2, Target, Calendar } from 'lucide-react'
import api from '@/lib/api'

interface Goal {
  id: string
  goal: string
  targetDate: string | null
  createdAt: string
  updatedAt: string
}

export default function GoalsPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState({ goal: '', targetDate: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadGoals()
      }
    }
  }, [router])

  async function loadGoals() {
    setLoading(true)
    try {
      const response = await api.get('/api/goals')
      if (response.data.success) {
        setGoals(response.data.goals || [])
      }
    } catch (error) {
      console.error('Failed to load goals:', error)
    }
    setLoading(false)
  }

  function handleNewGoal() {
    setEditingGoal(null)
    setFormData({ goal: '', targetDate: '' })
    setShowForm(true)
  }

  function handleEditGoal(goal: Goal) {
    setEditingGoal(goal)
    setFormData({
      goal: goal.goal,
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.goal.trim()) return

    setSubmitting(true)
    try {
      if (editingGoal) {
        // Update
        await api.put(`/api/goals/${editingGoal.id}`, formData)
      } else {
        // Create
        await api.post('/api/goals', formData)
      }
      setShowForm(false)
      setEditingGoal(null)
      setFormData({ goal: '', targetDate: '' })
      loadGoals()
    } catch (error: any) {
      console.error('Failed to save goal:', error)
      alert(error.response?.data?.error || 'Failed to save goal')
    }
    setSubmitting(false)
  }

  async function handleDelete(goalId: string) {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      await api.delete(`/api/goals/${goalId}`)
      loadGoals()
    } catch (error: any) {
      console.error('Failed to delete goal:', error)
      alert(error.response?.data?.error || 'Failed to delete goal')
    }
  }

  const isActive = (path: string) => {
    if (path === '/career') return pathname === path
    return pathname?.startsWith(path)
  }

  if (!workMeId || loading) {
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
              <Link href="/mywork" className="flex items-center space-x-2">
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
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                MyWork
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/mywork"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Career
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/career"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/career') && pathname === '/career'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/career/goals"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/career/goals')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Goals
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mycareer/track"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/mycareer/track')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Track
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mycareer/achievements"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/mycareer/achievements')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Achievements
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mycareer/reflections"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/mycareer/reflections')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Reflections
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Setup
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/setup"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Modules
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Career Goals (North Star)</h2>
                <p className="text-gray-600 mt-2">Set your professional objectives - your north star for the year</p>
                <p className="text-sm text-gray-500 mt-1 italic">
                  At least have something on file - doesn't need to be perfect, just document what you're aiming for.
                </p>
              </div>
              <button
                onClick={handleNewGoal}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5" />
                <span>New Goal</span>
              </button>
            </div>

            {/* Form Modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">
                    {editingGoal ? 'Edit Goal' : 'New Goal'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Goal *
                      </label>
                      <textarea
                        value={formData.goal}
                        onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                        placeholder="What do you want to achieve?"
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={formData.targetDate}
                        onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submitting ? 'Saving...' : editingGoal ? 'Update' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false)
                          setEditingGoal(null)
                          setFormData({ goal: '', targetDate: '' })
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Goals List */}
            {goals.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goals Yet</h3>
                <p className="text-gray-600 mb-4">Start by creating your first career goal</p>
                <button
                  onClick={handleNewGoal}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Create Your First Goal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Target className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditGoal(goal)}
                          className="text-gray-400 hover:text-blue-600 transition"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="text-gray-400 hover:text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-900 mb-3">{goal.goal}</p>
                    {goal.targetDate && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>
                          Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-3">
                      Created {new Date(goal.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
