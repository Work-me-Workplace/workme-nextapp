'use client'

import Link from 'next/link'
import { use, useState, useEffect } from 'react'
import api from '@/lib/api'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useSearchParams } from 'next/navigation'
import EmailDigestSidebar from '@/components/workforce/EmailDigestSidebar'

export default function CurateEditionPage({
  params,
}: {
  params: Promise<{ emailDigestId: string; editionId: string }>
}) {
  const { emailDigestId, editionId } = use(params)
  const searchParams = useSearchParams()
  const isFirst = searchParams?.get('isFirst') === 'true'
  const { session, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)
  const [edition, setEdition] = useState<any>(null)
  const [availableItems, setAvailableItems] = useState<any[]>([])
  const [editionItems, setEditionItems] = useState<any[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (authLoading || !session.firebaseId) return

      try {
        setLoading(true)
        // Fetch product
        const productResponse = await api.get(`/api/workforce/enduring/email-digest/${emailDigestId}`)
        if (productResponse.data.success) {
          setProduct(productResponse.data.product)
        }

        // Fetch edition with items
        const editionResponse = await api.get(`/api/workforce/enduring/email-digest/${emailDigestId}/editions/${editionId}`)
        if (editionResponse.data.success && editionResponse.data.edition) {
          setEdition(editionResponse.data.edition)
          // Extract items from editionItems junction
          const items = editionResponse.data.edition.editionItems?.map((ei: any) => ({
            ...ei.item,
            junctionId: ei.id,
            order: ei.order,
          })) || []
          setEditionItems(items.sort((a: any, b: any) => a.order - b.order))
        }

        // Fetch all available items
        const itemsResponse = await api.get('/api/workforce/enduring/email-digest/items')
        if (itemsResponse.data.success) {
          // Filter to only READY items
          const readyItems = (itemsResponse.data.items || []).filter((item: any) => item.status === 'READY')
          setAvailableItems(readyItems)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [emailDigestId, editionId, authLoading, session.firebaseId])

  const handleAddItems = async () => {
    if (selectedItemIds.size === 0) {
      alert('Please select at least one item to add')
      return
    }

    setSaving(true)
    try {
      const response = await api.post(
        `/api/workforce/enduring/email-digest/${emailDigestId}/editions/${editionId}/items`,
        { itemIds: Array.from(selectedItemIds) }
      )

      if (response.data.success) {
        // Refresh edition items
        const editionResponse = await api.get(`/api/workforce/enduring/email-digest/${emailDigestId}/editions/${editionId}`)
        if (editionResponse.data.success && editionResponse.data.edition) {
          const items = editionResponse.data.edition.editionItems?.map((ei: any) => ({
            ...ei.item,
            junctionId: ei.id,
            order: ei.order,
          })) || []
          setEditionItems(items.sort((a: any, b: any) => a.order - b.order))
        }
        setSelectedItemIds(new Set())
      } else {
        alert('Failed to add items: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Error adding items:', error)
      alert('Failed to add items: ' + (error.response?.data?.error || error.message))
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remove this item from the edition?')) return

    try {
      const response = await api.delete(
        `/api/workforce/enduring/email-digest/${emailDigestId}/editions/${editionId}/items?itemId=${itemId}`
      )

      if (response.data.success) {
        // Refresh edition items
        const editionResponse = await api.get(`/api/workforce/enduring/email-digest/${emailDigestId}/editions/${editionId}`)
        if (editionResponse.data.success && editionResponse.data.edition) {
          const items = editionResponse.data.edition.editionItems?.map((ei: any) => ({
            ...ei.item,
            junctionId: ei.id,
            order: ei.order,
          })) || []
          setEditionItems(items.sort((a: any, b: any) => a.order - b.order))
        }
      } else {
        alert('Failed to remove item: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Error removing item:', error)
      alert('Failed to remove item: ' + (error.response?.data?.error || error.message))
    }
  }

  const toggleItemSelection = (itemId: string) => {
    const newSet = new Set(selectedItemIds)
    if (newSet.has(itemId)) {
      newSet.delete(itemId)
    } else {
      newSet.add(itemId)
    }
    setSelectedItemIds(newSet)
  }

  // Filter out items already in edition
  const itemsNotInEdition = availableItems.filter(
    (item) => !editionItems.some((ei) => ei.id === item.id)
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session.firebaseId) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/workforce/enduring/email-digest" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <EmailDigestSidebar />
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href={`/workforce/enduring/email-digest/${emailDigestId}`}
              className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
            >
              ← Back to Series
            </Link>

            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isFirst ? 'Create First Edition' : 'Curate Edition'}
              </h1>
              <p className="text-gray-600">
                {product?.title && `Series: ${product.title}`}
                {edition && ` • Edition created ${new Date(edition.generatedAt).toLocaleDateString()}`}
              </p>
            </div>

            {isFirst && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg
                className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-green-900 mb-1">Series Created Successfully!</h3>
                  <p className="text-sm text-green-800">
                    Now add "Need to Know" items to this edition. Items should be created from workstuff first.
                  </p>
                </div>
              </div>
            </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Available Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Available Items</h2>
              <Link
                href="/workforce/enduring/email-digest/items/new"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Create New Item
              </Link>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select items to add to this edition. Only "READY" items are shown.
            </p>

            {itemsNotInEdition.length === 0 ? (
              <div className="text-center py-8">
                <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 mb-4">No available items. Create some first!</p>
                <Link
                  href="/workforce/enduring/email-digest/items/new"
                  className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Create Item from Workstuff
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                  {itemsNotInEdition.map((item) => {
                    const content = item.formattedContent as any
                    const isSelected = selectedItemIds.has(item.id)
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItemSelection(item.id)}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 mb-1">
                            {content?.title || 'Untitled Item'}
                          </div>
                          {content?.body && (
                            <div
                              className="text-sm text-gray-600 line-clamp-2"
                              dangerouslySetInnerHTML={{
                                __html: content.body.substring(0, 100) + '...',
                              }}
                            />
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {item.sourceType || 'Manual'} • {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
                <button
                  onClick={handleAddItems}
                  disabled={saving || selectedItemIds.size === 0}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Adding...' : `Add ${selectedItemIds.size} Item${selectedItemIds.size !== 1 ? 's' : ''} to Edition`}
                </button>
              </>
            )}
          </div>

          {/* RIGHT: Items in Edition */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Items in Edition ({editionItems.length})
            </h2>

            {editionItems.length === 0 ? (
              <div className="text-center py-8">
                <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No items added yet. Select items from the left to add them.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {editionItems.map((item, index) => {
                  const content = item.formattedContent as any
                  return (
                    <div
                      key={item.junctionId}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                          <div className="font-semibold text-gray-900">
                            {content?.title || 'Untitled Item'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      {content?.body && (
                        <div
                          className="text-sm text-gray-600 line-clamp-3 mb-2"
                          dangerouslySetInnerHTML={{
                            __html: content.body.substring(0, 150) + '...',
                          }}
                        />
                      )}
                      <div className="text-xs text-gray-500">
                        {item.sourceType || 'Manual'} • {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {editionItems.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <Link
                  href={`/workforce/enduring/email-digest/${emailDigestId}/editions/${editionId}`}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition inline-block text-center"
                >
                  Review & Generate Edition
                </Link>
              </div>
            )}
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
