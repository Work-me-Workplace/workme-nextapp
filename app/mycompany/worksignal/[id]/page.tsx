'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Sparkles, TrendingUp, Users as UsersIcon, Plus } from 'lucide-react'

interface WorkSignal {
  id: string
  type: 'meeting' | 'note' | 'leader_comment' | 'external_hint'
  title: string
  summary: string
  source?: string
  createdAt: string
}

export default function WorkSignalDetailPage() {
  const params = useParams()
  const signalId = params?.id as string

  // TODO: Load signal data
  const signalData: WorkSignal | null = null

  if (!signalData) {
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
          <main className="flex-1">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">WorkSignal not found</p>
                <Link href="/mycompany/worksignal" className="text-blue-600 hover:text-blue-700">
                  ← Back to WorkSignals
                </Link>
              </div>
            </div>
          </main>
        </div>
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

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/mycompany/worksignal" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
              ← Back to WorkSignals
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              {/* TypeScript workaround: signalData is always null in current implementation */}
              {signalData ? (() => {
                const signal = signalData as WorkSignal
                return (
                  <>
                    <div className="flex items-center mb-4">
                      <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
                      <span className="text-xs font-medium text-gray-500 uppercase bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {signal.type.replace('_', ' ')}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{signal.title}</h1>
                    <div className="prose max-w-none mb-6">
                      <p className="text-gray-700">{signal.summary}</p>
                    </div>
                  </>
                )
              })() : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Signal data will be loaded here</p>
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-6 border-t">
                <Link
                  href={`/mycompany/milestones/new?signalId=${signalId}`}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Promote to Milestone
                </Link>
                <Link
                  href={`/mycompany/workforcestuff/new?signalId=${signalId}`}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  <UsersIcon className="h-5 w-5 mr-2" />
                  Promote to WorkforceStuffItem
                </Link>
                <Link
                  href={`/mywork/create?signalId=${signalId}`}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add to MyWork
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

