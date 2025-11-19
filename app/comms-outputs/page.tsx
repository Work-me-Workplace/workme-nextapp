'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCommsOutputs, deleteCommsOutput } from '@/lib/actions/comms-outputs'

export default function CommsOutputsPage() {
  const [commsOutputs, setCommsOutputs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCommsOutputs()
  }, [])

  async function loadCommsOutputs() {
    setLoading(true)
    const result = await getCommsOutputs()
    if (result.success) {
      setCommsOutputs(result.commsOutputs || [])
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this comms output?')) {
      const result = await deleteCommsOutput(id)
      if (result.success) {
        loadCommsOutputs()
      } else {
        alert('Failed to delete comms output')
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Communication Outputs</h2>
          <p className="text-gray-600 mt-2">Manage your communication outputs</p>
        </div>
        <Link
          href="/comms-outputs/new"
          className="rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition"
        >
          New Comms Output
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : commsOutputs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 mb-4">No comms outputs yet</p>
            <Link
              href="/comms-outputs/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first comms output →
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
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Word Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commsOutputs.map((comms) => (
                  <tr key={comms.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {comms.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {comms.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {comms.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comms.wordCount || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comms.dateSent ? new Date(comms.dateSent).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Link
                          href={`/comms-outputs/${comms.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(comms.id)}
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

