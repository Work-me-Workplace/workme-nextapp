'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkContext } from '@/lib/actions/work-context'
import { getWorkSupportByContext, WORK_OUTPUT_TYPES } from '@/lib/actions/work-support'
import { createWorkOutput } from '@/lib/actions/work-output'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'

export default function WorkSupportPage() {
  const router = useRouter()
  const params = useParams()
  const contextId = params.contextId as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [workContext, setWorkContext] = useState<any>(null)
  const [workSupport, setWorkSupport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
      const clientWorkMeId = typeof window !== 'undefined' ? getWorkMeIdFromStorage() : null
      const [contextResult, supportResult] = await Promise.all([
        getWorkContext(contextId, clientWorkMeId),
        getWorkSupportByContext(contextId),
      ])

      if (contextResult.success && contextResult.workContext) {
        setWorkContext(contextResult.workContext)
      } else {
        alert('WorkContext not found')
        router.push('/mywork/context')
        return
      }

      if (supportResult.success && supportResult.support) {
        setWorkSupport(supportResult.support)
      } else {
        // No WorkSupport exists yet - redirect to setup
        router.push(`/mywork/support/${contextId}/setup`)
        return
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      router.push('/mywork/context')
    }
    setLoading(false)
  }

  async function handleCreateOutput(outputType: string) {
    if (!workSupport) return

    try {
      const result = await createWorkOutput({
        contextId,
        supportId: workSupport.id,
        outputType,
        status: 'draft',
      })

      if (result.success && result.workOutput) {
        // Redirect to builder page
        router.push(`/mywork/outputs/${outputType}/${result.workOutput.id}`)
      } else {
        alert('Failed to create output: ' + JSON.stringify(result.error))
      }
    } catch (error) {
      console.error('Error creating output:', error)
      alert('Failed to create output')
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!workContext || !workSupport) {
    return null
  }

  const selectedOutputTypes = workSupport.selectedOutputs || []
  const createdOutputs = workSupport.outputs || []
  const outputTypesMap = new Map(WORK_OUTPUT_TYPES.map(t => [t.value, t.label]))

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href={`/mywork/context/${contextId}`} 
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to WorkContext
        </Link>

        {/* WorkSupport Container */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WorkSupport</h1>
                <p className="text-gray-600 mt-1">Support container for {workContext.title}</p>
              </div>
            </div>
            <Link
              href={`/mywork/support/${contextId}/setup`}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit Setup
            </Link>
          </div>

          <div className="mb-6">
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${
              workSupport.status === 'complete' ? 'bg-green-100 text-green-800' :
              workSupport.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {workSupport.status || 'draft'}
            </span>
          </div>

          {/* Selected Outputs Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Selected WorkOutputs</h2>
            {selectedOutputTypes.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  No outputs selected yet. <Link href={`/mywork/support/${contextId}/setup`} className="underline font-medium">Set up WorkSupport</Link> to select outputs.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedOutputTypes.map((outputType: string) => {
                  const existingOutput = createdOutputs.find((o: any) => o.outputType === outputType)
                  const label = outputTypesMap.get(outputType) || outputType

                  return (
                    <div
                      key={outputType}
                      className={`border-2 rounded-lg p-4 ${
                        existingOutput
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{label}</h3>
                        {existingOutput && (
                          <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded">
                            Created
                          </span>
                        )}
                      </div>
                      {existingOutput ? (
                        <Link
                          href={`/mywork/outputs/builder/${existingOutput.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit Output →
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleCreateOutput(outputType)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Create Output →
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Created Outputs List */}
          {createdOutputs.length > 0 && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Created Outputs</h2>
              <div className="space-y-2">
                {createdOutputs.map((output: any) => (
                  <Link
                    key={output.id}
                    href={`/mywork/outputs/builder/${output.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{outputTypesMap.get(output.outputType) || output.outputType}</span>
                        <span className={`ml-2 text-xs px-2 py-1 rounded ${
                          output.status === 'final' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {output.status || 'draft'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(output.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

