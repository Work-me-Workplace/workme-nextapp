'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkContext } from '@/lib/actions/work-context'
import { getWorkOutputsByContext, createWorkOutput, updateWorkOutput } from '@/lib/actions/work-output'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId'

export default function EventKitOutputPage() {
  const router = useRouter()
  const params = useParams()
  const contextId = params.contextId as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [workContext, setWorkContext] = useState<any>(null)
  const [workOutput, setWorkOutput] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    kitName: '',
    description: '',
    assets: '',
    instructions: '',
  })

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
        const eventKitOutput = outputsResult.workOutputs?.find((o: any) => o.outputType === 'event_kit')
        if (eventKitOutput) {
          setWorkOutput(eventKitOutput)
          const data = eventKitOutput.dataJson as any
          if (data) {
            setFormData({
              kitName: data.kitName || '',
              description: data.description || '',
              assets: data.assets || '',
              instructions: data.instructions || '',
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      router.push('/mywork/context')
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!workMeId) return
    setSaving(true)
    try {
      const dataJson = {
        kitName: formData.kitName,
        description: formData.description,
        assets: formData.assets,
        instructions: formData.instructions,
      }

      if (workOutput) {
        const result = await updateWorkOutput(workOutput.id, { dataJson })
        if (result.success) {
          alert('Event kit saved!')
          loadData()
        } else {
          alert('Failed to save: ' + (result.error || 'Unknown error'))
        }
      } else {
        const result = await createWorkOutput({
          contextId,
          outputType: 'event_kit',
          dataJson,
        })
        if (result.success && result.workOutput) {
          alert('Event kit created!')
          setWorkOutput(result.workOutput)
        } else {
          alert('Failed to create: ' + (result.error || 'Unknown error'))
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
          href={`/mywork/outputs/${contextId}`} 
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to WorkOutputs
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📦</span>
            <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded capitalize">
              {workContext.type}
            </span>
            <span className="text-sm text-gray-500">{workContext.title}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Event Kit</h1>
          <p className="text-gray-600 mt-1">Create an event kit with multiple assets for this context</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="kitName" className="block text-sm font-medium text-gray-700 mb-2">
                Kit Name
              </label>
              <input
                type="text"
                id="kitName"
                value={formData.kitName}
                onChange={(e) => setFormData({ ...formData, kitName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Event kit name"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the event kit..."
              />
            </div>

            <div>
              <label htmlFor="assets" className="block text-sm font-medium text-gray-700 mb-2">
                Assets (one per line)
              </label>
              <textarea
                id="assets"
                value={formData.assets}
                onChange={(e) => setFormData({ ...formData, assets: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="• Poster&#10;• Email template&#10;• Talking points&#10;• Social media graphics"
              />
            </div>

            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Instructions for using the event kit..."
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : workOutput ? 'Update Event Kit' : 'Create Event Kit'}
              </button>
              <Link
                href={`/mywork/outputs/${contextId}`}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

