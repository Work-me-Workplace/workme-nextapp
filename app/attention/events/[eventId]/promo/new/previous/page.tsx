'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getPromotionalWorkItemsByEvent } from '@/lib/actions/promotional-work-item'

export default function PromotionalProductPreviousPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true)
      try {
        const result = await getPromotionalWorkItemsByEvent(eventId)
        if (result.success && result.items) {
          setItems(result.items)
        } else {
          setError(result.error || 'Failed to load previous products')
        }
      } catch (err) {
        console.error('Error loading items:', err)
        setError('Failed to load previous products')
      } finally {
        setLoading(false)
      }
    }
    loadItems()
  }, [eventId])

  const handleSelectItem = (item: any) => {
    // Navigate to scratch form with pre-filled data
    const queryParams = new URLSearchParams({
      name: item.name || '',
      type: item.type || 'poster_22x26',
      title: item.title || '',
      headline: item.headline || '',
      subheadline: item.subheadline || '',
      details: item.details || '',
      perks: item.perks || '',
      participation: item.participation || '',
      foodProvided: item.foodProvided || '',
      foodTypes: item.foodTypes || '',
      theme: item.theme || '',
      eventDateBlock: item.eventDateBlock || '',
      eventTimeBlock: item.eventTimeBlock || '',
      rsvpLink: item.rsvpLink || '',
    })
    router.push(`/attention/events/${eventId}/promo/new/scratch?${queryParams.toString()}`)
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href={`/attention/events/${eventId}/promo/new`} 
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to Creation Options
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Start From Previous Product</h2>
          <p className="text-gray-600 mb-4">Select a previous promotional product to use as a template.</p>

          {loading && <p className="text-gray-500">Loading products...</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!loading && items.length === 0 && !error && (
            <p className="text-gray-500">No previous products found. Try creating one from scratch!</p>
          )}

          <div className="space-y-4">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600">
                  {item.type && <span className="capitalize">{item.type.replace('_', ' ')}</span>}
                  {item.title && <span className="ml-2">• {item.title}</span>}
                </p>
                {item.createdAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Created {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-4 pt-6 mt-6 border-t">
            <Link
              href={`/attention/events/${eventId}/promo/new`}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

