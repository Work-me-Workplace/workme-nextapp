'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
// DEPRECATED: objectives and comms-outputs actions are deprecated
// import { getObjectives } from '@/lib/actions/objectives'
// import { getCommsOutputs } from '@/lib/actions/comms-outputs'

export default function SetupPage() {
  const [objectivesCount, setObjectivesCount] = useState(0)
  const [commsOutputsCount, setCommsOutputsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCounts()
  }, [])

  async function loadCounts() {
    setLoading(true)
    // DEPRECATED: Objectives and comms outputs are deprecated
    setObjectivesCount(0)
    setCommsOutputsCount(0)
    setLoading(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Setup Dashboard</h2>
        <p className="text-gray-600 mt-2">
          Configure your Objectives and Comms Outputs before creating Achievements
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Objectives Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Objectives</h3>
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">
              Define your professional objectives and how they're measured.
            </p>
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">{objectivesCount}</p>
              <p className="text-sm text-gray-500">Objectives created</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/objectives"
                className="flex-1 text-center rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700 transition"
              >
                View All
              </Link>
              <Link
                href="/objectives/new"
                className="flex-1 text-center rounded-lg bg-gray-200 text-gray-700 px-4 py-2 font-semibold hover:bg-gray-300 transition"
              >
                Create New
              </Link>
            </div>
          </div>

          {/* Comms Outputs Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Comms Outputs</h3>
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">
              Track your communication outputs like emails, flyers, and announcements.
            </p>
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">{commsOutputsCount}</p>
              <p className="text-sm text-gray-500">Comms outputs created</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/comms-outputs"
                className="flex-1 text-center rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700 transition"
              >
                View All
              </Link>
              <Link
                href="/comms-outputs/new"
                className="flex-1 text-center rounded-lg bg-gray-200 text-gray-700 px-4 py-2 font-semibold hover:bg-gray-300 transition"
              >
                Create New
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Create Achievements?</h3>
        <p className="text-blue-800 mb-4">
          Once you've set up your Objectives and Comms Outputs, you can start creating Achievements that link to them.
        </p>
        <Link
          href="/achievements/new"
          className="inline-block rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition"
        >
          Create Your First Achievement
        </Link>
      </div>
    </div>
  )
}

