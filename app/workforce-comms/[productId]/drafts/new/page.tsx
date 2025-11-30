'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useState, useEffect } from 'react'
import { createWorkforceCommsDraft, getWorkforceCommsProduct } from '@/lib/actions/workforce-comms'
import { getCompanyXContexts } from '@/lib/actions/company-x'

export default function NewDraftPage({ params }: { params: Promise<{ productId: string }> }) {
  const router = useRouter()
  const { productId } = use(params)
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [workContexts, setWorkContexts] = useState<any[]>([])
  const [formData, setFormData] = useState({
    contextIds: [] as string[],
    authorNotes: '',
    whatChanged: '',
    priorityNotes: '',
  })

  useEffect(() => {
    async function fetchData() {
      // Fetch product
      const productResult = await getWorkforceCommsProduct(productId)
      if (productResult.success && productResult.product) {
        setProduct(productResult.product)
        // Pre-fill lastEdition if available
        if (productResult.product.editions && productResult.product.editions.length > 0) {
          // Will be automatically set in create action
        }
      }

      // Fetch available work contexts
      const contextsResult = await getCompanyXContexts()
      if (contextsResult.success && contextsResult.workContexts) {
        setWorkContexts(contextsResult.workContexts)
      }
    }
    fetchData()
  }, [productId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await createWorkforceCommsDraft({
        workforceCommsId: productId,
        // eventRouterIds removed - use CompanyWorkLink instead
        authorNotes: formData.authorNotes || null,
        whatChanged: formData.whatChanged || null,
        priorityNotes: formData.priorityNotes || null,
        status: 'drafting',
      })

      if (result.success && result.draft) {
        router.push(`/workforce-comms/${productId}/drafts/${result.draft.draftId}`)
      } else {
        alert('Failed to create draft: ' + (result.error || 'Unknown error'))
        setLoading(false)
      }
    } catch (error) {
      console.error('Error creating draft:', error)
      alert('Failed to create draft')
      setLoading(false)
    }
  }

  const toggleContext = (contextId: string) => {
    setFormData({
      ...formData,
      contextIds: formData.contextIds.includes(contextId)
        ? formData.contextIds.filter(id => id !== contextId)
        : [...formData.contextIds, contextId],
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/workforce-comms" className="flex items-center space-x-2">
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
        <Link href={`/workforce-comms/${productId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
          ← Back to Product
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create New Draft - {product?.name || 'Loading...'}
          </h2>
          <p className="text-gray-600 mb-6">Set up context and notes for GPT generation</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Work Contexts Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Work Contexts
              </label>
              {workContexts.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {workContexts.map((context) => (
                    <label
                      key={context.id}
                      className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.contextIds.includes(context.id)}
                        onChange={() => toggleContext(context.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-gray-900">{context.title || 'Untitled'}</p>
                        <p className="text-sm text-gray-500 mt-1">{context.type}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No work contexts available. Create some contexts first.</p>
              )}
            </div>

            {/* Author Notes */}
            <div>
              <label htmlFor="authorNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Author Notes
              </label>
              <textarea
                id="authorNotes"
                value={formData.authorNotes}
                onChange={(e) => setFormData({ ...formData, authorNotes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What should GPT know about this draft? Any specific instructions or tone?"
              />
            </div>

            {/* What Changed */}
            <div>
              <label htmlFor="whatChanged" className="block text-sm font-medium text-gray-700 mb-2">
                What Changed
              </label>
              <textarea
                id="whatChanged"
                value={formData.whatChanged}
                onChange={(e) => setFormData({ ...formData, whatChanged: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What's different from the last send? Key changes or updates to highlight."
              />
            </div>

            {/* Priority Notes */}
            <div>
              <label htmlFor="priorityNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Priority Notes
              </label>
              <textarea
                id="priorityNotes"
                value={formData.priorityNotes}
                onChange={(e) => setFormData({ ...formData, priorityNotes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 'still a priority', 'emphasize X', 'focus on Y'"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Draft'}
              </button>
              <Link
                href={`/workforce-comms/${productId}`}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

