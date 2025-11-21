'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkContext } from '@/lib/actions/work-context'
import { getWorkSupportByContext, createWorkSupport, updateWorkSupport } from '@/lib/actions/work-support'
import { WORK_OUTPUT_TYPES } from '@/lib/actions/work-support'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'

export default function WorkSupportSetupPage() {
  const router = useRouter()
  const params = useParams()
  const contextId = params.contextId as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [workContext, setWorkContext] = useState<any>(null)
  const [workSupport, setWorkSupport] = useState<any>(null)
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      const [contextResult, supportResult] = await Promise.all([
        getWorkContext(contextId),
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
        setSelectedOutputs(supportResult.support.selectedOutputs || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      router.push('/mywork/context')
    }
    setLoading(false)
  }

  function handleToggleOutput(outputType: string) {
    setSelectedOutputs(prev => {
      if (prev.includes(outputType)) {
        return prev.filter(t => t !== outputType)
      } else {
        return [...prev, outputType]
      }
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (workSupport) {
        // Update existing
        const result = await updateWorkSupport(workSupport.id, {
          selectedOutputs,
          status: selectedOutputs.length > 0 ? 'in_progress' : 'draft',
        })

        if (result.success) {
          router.push(`/mywork/support/${contextId}`)
        } else {
          alert('Failed to update WorkSupport: ' + JSON.stringify(result.error))
        }
      } else {
        // Create new
        const result = await createWorkSupport({
          contextId,
          selectedOutputs,
          status: selectedOutputs.length > 0 ? 'in_progress' : 'draft',
        })

        if (result.success) {
          router.push(`/mywork/support/${contextId}`)
        } else {
          alert('Failed to create WorkSupport: ' + JSON.stringify(result.error))
        }
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save')
    }
    setSaving(false)
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href={`/mywork/context/${contextId}`} 
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to WorkContext
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup WorkSupport</h1>
            <p className="text-gray-600">
              Select which WorkOutputs you need for this context: <span className="font-semibold">{workContext.title}</span>
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select WorkOutput Types</h2>
            <div className="space-y-3">
              {WORK_OUTPUT_TYPES.map((output) => {
                const isSelected = selectedOutputs.includes(output.value)
                return (
                  <label
                    key={output.value}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleOutput(output.value)}
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-900 font-medium">{output.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Internal Comms Modules</h3>
            <p className="text-sm text-blue-800 mb-2">
              These modules describe broad comms domains:
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li>Workforce Communications</li>
              <li>Messaging & Talking Points</li>
              <li>Digital Products</li>
              <li>Print Products</li>
              <li>SharePoint / Web Publishing</li>
              <li>Photography & Videography</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
            <Link
              href={`/mywork/context/${contextId}`}
              className="flex-1 text-center bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

