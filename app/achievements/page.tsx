'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getAchievements, deleteAchievement } from '@/lib/actions/achievements'

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAchievements()
  }, [])

  async function loadAchievements() {
    setLoading(true)
    const result = await getAchievements()
    if (result.success) {
      setAchievements(result.achievements || [])
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this achievement?')) {
      const result = await deleteAchievement(id)
      if (result.success) {
        loadAchievements()
      } else {
        alert('Failed to delete achievement')
      }
    }
  }

  const categoryLabels: { [key: string]: string } = {
    INTERNAL_COMMS: 'Internal Comms',
    WORKFORCE_COMMS: 'Workforce Comms',
    EVENT_SUPPORT: 'Event Support',
    EXECUTIVE_LEADERSHIP: 'Executive Leadership',
    OPERATIONS_SUPPORT: 'Operations Support',
    READINESS: 'Readiness',
    ADMIN: 'Admin',
    COMMUNITY_ENGAGEMENT: 'Community Engagement',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
    <div>
          <h2 className="text-3xl font-bold text-gray-900">Achievements</h2>
          <p className="text-gray-600 mt-2">Track your professional achievements and contributions</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/achievements/upload"
            className="rounded-lg bg-gray-600 text-white px-6 py-3 font-semibold hover:bg-gray-700 transition"
          >
            Upload CSV
          </Link>
          <Link
            href="/achievements/new"
            className="rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition"
          >
            Add Manually
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : achievements.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <p className="text-gray-500 mb-4">No achievements yet</p>
            <Link
              href="/achievements/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first achievement →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Objective
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comms Output
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {achievements.map((achievement) => (
                  <tr key={achievement.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {achievement.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {categoryLabels[achievement.category] || achievement.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {achievement.objective?.title || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {achievement.commsOutput?.title || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(achievement.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Link
                          href={`/achievements/${achievement.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(achievement.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
