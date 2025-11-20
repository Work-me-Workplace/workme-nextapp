'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getObjectives, deleteObjective } from '@/lib/actions/objectives'

export default function ObjectivesPage() {
  const [objectives, setObjectives] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadObjectives()
  }, [])

  async function loadObjectives() {
    setLoading(true)
    const result = await getObjectives()
    if (result.success) {
      setObjectives(result.objectives || [])
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this objective?')) {
      const result = await deleteObjective(id)
      if (result.success) {
        loadObjectives()
      } else {
        alert('Failed to delete objective')
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/setup" className="text-blue-600 hover:text-blue-700 mb-2 inline-block text-sm">
            ← Back to Setup
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Objectives</h2>
          <p className="text-gray-600 mt-2">Manage your professional objectives</p>
        </div>
        <Link
          href="/objectives/new"
          className="rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition"
        >
          New Objective
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : objectives.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 mb-4">No objectives yet</p>
            <Link
              href="/objectives/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first objective →
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
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    How Measured
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {objectives.map((objective) => (
                  <tr key={objective.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {objective.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {objective.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {objective.howMeasured || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(objective.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Link
                          href={`/objectives/${objective.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(objective.id)}
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
