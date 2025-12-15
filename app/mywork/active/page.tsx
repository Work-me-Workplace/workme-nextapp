'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { CheckSquare, Clock, Archive } from 'lucide-react'
import api from '@/lib/api'

interface WorkOutput {
  id: string
  title: string
  outputType: string
  status: string
  deadline?: string | null
  createdAt: string
  viewPath?: string
}

export default function StuffImWorkingOnPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [outputs, setOutputs] = useState<WorkOutput[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadActiveOutputs()
      }
    }
  }, [router])

  async function loadActiveOutputs() {
    try {
      setLoading(true)
      const response = await api.get('/api/mywork/active/list')
      
      if (response.data.success && response.data.items) {
        setOutputs(response.data.items)
      } else {
        setOutputs([])
      }
    } catch (error: any) {
      console.error('Failed to load active outputs:', error)
      setOutputs([])
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const activeOutputs = outputs.filter(o => o.status !== 'archived')
  const archivedOutputs = outputs.filter(o => o.status === 'archived')

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Stuff I'm Working On</h1>
              <p className="text-gray-600 mt-2">Your active work outputs and tasks</p>
            </div>

            {activeOutputs.length > 0 ? (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    Active
                  </h2>
                  <span className="text-sm text-gray-500">{activeOutputs.length} items</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeOutputs.map(output => (
                    <Link
                      key={output.id}
                      href={output.viewPath || '#'}
                      className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {output.outputType.replace('_', ' ')}
                        </span>
                        {output.deadline && new Date(output.deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                          <span className="text-xs font-medium text-orange-600">Due Soon</span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{output.title}</h3>
                      {output.deadline && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          Due {new Date(output.deadline).toLocaleDateString()}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        Created {new Date(output.createdAt).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center mb-8">
                <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Work</h3>
                <p className="text-gray-600 mb-4">You don't have any active work outputs right now.</p>
                <Link
                  href="/mywork/create"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Create Output
                </Link>
              </div>
            )}

            {archivedOutputs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Archive className="h-5 w-5 text-gray-400 mr-2" />
                    Archived
                  </h2>
                  <span className="text-sm text-gray-500">{archivedOutputs.length} items</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {archivedOutputs.map(output => (
                    <div
                      key={output.id}
                      className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-300 opacity-75"
                    >
                      <span className="text-xs font-medium text-gray-500 uppercase bg-gray-100 text-gray-800 px-2 py-1 rounded mb-2 inline-block">
                        {output.outputType}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">{output.title}</h3>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

