'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'
import { FileText, Sparkles, Plus } from 'lucide-react'

export default function NewMilestonePage() {
  const router = useRouter()
  const [method, setMethod] = useState<'manual' | 'previous' | 'ai' | null>(null)

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
            <Link href="/mycompany/milestones" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
              ← Back to Milestones
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Add Company Milestone</h1>
              <p className="text-gray-600 mt-2">Choose how you want to add this milestone</p>
            </div>

            {!method ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setMethod('manual')}
                  className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition text-left border-2 border-transparent hover:border-blue-500"
                >
                  <FileText className="h-8 w-8 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Manually</h3>
                  <p className="text-sm text-gray-600">Enter milestone details yourself</p>
                </button>

                <button
                  onClick={() => setMethod('previous')}
                  className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition text-left border-2 border-transparent hover:border-blue-500"
                >
                  <Plus className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Pull Previous Milestone</h3>
                  <p className="text-sm text-gray-600">Reuse a previous milestone as template</p>
                </button>

                <button
                  onClick={() => setMethod('ai')}
                  className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition text-left border-2 border-transparent hover:border-blue-500"
                >
                  <Sparkles className="h-8 w-8 text-purple-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate w/ AI</h3>
                  <p className="text-sm text-gray-600">Provide URL or paste content to generate</p>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="mb-6">
                  <button
                    onClick={() => setMethod(null)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Choose Different Method
                  </button>
                </div>
                {method === 'manual' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Entry</h2>
                    <p className="text-gray-600">Manual entry form coming soon...</p>
                  </div>
                )}
                {method === 'previous' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Pull Previous Milestone</h2>
                    <p className="text-gray-600">Previous milestone selector coming soon...</p>
                  </div>
                )}
                {method === 'ai' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate with AI</h2>
                    <p className="text-gray-600">AI generation form coming soon...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

