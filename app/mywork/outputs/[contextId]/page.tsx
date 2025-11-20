'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkContext } from '@/lib/actions/work-context'
import { getWorkOutputsByContext } from '@/lib/actions/work-output'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'

export default function WorkOutputsSelectionPage() {
  const router = useRouter()
  const params = useParams()
  const contextId = params.contextId as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [workContext, setWorkContext] = useState<any>(null)
  const [existingOutputs, setExistingOutputs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const outputTypes = [
    { id: 'email', name: 'Email', description: 'Create an email communication', icon: '📧' },
    { id: 'poster', name: 'Poster', description: 'Design a poster or flyer', icon: '🖼️' },
    { id: 'talking_points', name: 'Talking Points', description: 'Create talking points and key messages', icon: '💬' },
    { id: 'sharepoint', urlPath: 'sharepoint-block', name: 'SharePoint Block', description: 'Build a SharePoint content block', icon: '📄' },
    { id: 'event_kit', name: 'Event Kit', description: 'Create an event kit with multiple assets', icon: '📦' },
  ]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadData()
      }
    }
  }, [contextId, router])

  async function loadData() {
    if (!contextId) return
    setLoading(true)
    try {
      const contextResult = await getWorkContext(contextId)
      if (contextResult.success && contextResult.workContext) {
        setWorkContext(contextResult.workContext)
      } else {
        alert('WorkContext not found')
        router.push('/mywork/context')
        return
      }

      const outputsResult = await getWorkOutputsByContext(contextId)
      if (outputsResult.success) {
        setExistingOutputs(outputsResult.workOutputs || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      router.push('/mywork/context')
    }
    setLoading(false)
  }

  const getExistingOutput = (outputType: string) => {
    return existingOutputs.find(output => output.outputType === outputType)
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!workContext) {
    return null
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
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href={`/mywork/context/${contextId}`} 
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to WorkContext
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded capitalize">
              {workContext.type}
            </span>
            <span className="text-sm text-gray-500">{workContext.title}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WorkOutputs</h1>
          <p className="text-gray-600">Select or create an output type for this context</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outputTypes.map((outputType) => {
            const existing = getExistingOutput(outputType.id)
            const urlPath = (outputType as any).urlPath || outputType.id
            return (
              <Link
                key={outputType.id}
                href={`/mywork/outputs/${contextId}/${urlPath}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{outputType.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{outputType.name}</h3>
                    {existing && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded mt-1">
                        Exists
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{outputType.description}</p>
                {existing ? (
                  <div className="text-sm text-gray-500">
                    Last updated {new Date(existing.updatedAt).toLocaleDateString()}
                  </div>
                ) : (
                  <span className="text-blue-600 font-medium text-sm">Create →</span>
                )}
              </Link>
            )
          })}
        </div>

        {existingOutputs.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Outputs</h2>
            <div className="space-y-3">
              {existingOutputs.map((output) => (
                <Link
                  key={output.id}
                  href={`/mywork/outputs/${contextId}/${output.outputType}`}
                  className="block border-l-4 border-blue-600 pl-4 py-2 hover:bg-gray-50 rounded-r"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{output.outputType.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">
                        Updated {new Date(output.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-blue-600 text-sm font-medium">View →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

