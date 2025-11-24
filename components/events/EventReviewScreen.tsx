'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkEventFromIngest } from '@/lib/actions/event-ingestion'
import type { EventIngestionResponse, ParsedEventItem } from '@/lib/types/event-ingestion'

interface EventReviewScreenProps {
  ingestionData: EventIngestionResponse
  onBack: () => void
  onEdit: () => void
}

export default function EventReviewScreen({ ingestionData, onBack, onEdit }: EventReviewScreenProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const result = await createWorkEventFromIngest(ingestionData)

      if (result.success) {
        // Navigate to success screen
        router.push(`/mywork/context/${result.eventId}/success`)
      } else {
        setError(result.error || 'Failed to save event')
        setSaving(false)
      }
    } catch (err) {
      console.error('Error saving event:', err)
      setError('Failed to save event. Please try again.')
      setSaving(false)
    }
  }

  const event = ingestionData.event
  const items = ingestionData.items || []

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Review & Confirm</h2>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Edit
          </button>
          <button
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Event Details */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <p className="text-sm text-gray-900">{event.title || '—'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <p className="text-sm text-gray-900">{event.eventCategory || '—'}</p>
            </div>

            {event.eventDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                <p className="text-sm text-gray-900">{event.eventDate}</p>
              </div>
            )}

            {event.startTime && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <p className="text-sm text-gray-900">{event.startTime}</p>
              </div>
            )}

            {event.endTime && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <p className="text-sm text-gray-900">{event.endTime}</p>
              </div>
            )}

            {event.registrationRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Required</label>
                <p className="text-sm text-gray-900">{event.registrationRequired}</p>
              </div>
            )}

            {event.registrationLink && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Link</label>
                <a 
                  href={event.registrationLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {event.registrationLink}
                </a>
              </div>
            )}

            {event.foodProvided && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Provided</label>
                <p className="text-sm text-gray-900">{event.foodProvided}</p>
              </div>
            )}

            {event.foodTypes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Types</label>
                <p className="text-sm text-gray-900">{event.foodTypes}</p>
              </div>
            )}
          </div>

          {event.description && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {event.speakers && event.speakers.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Speakers</label>
              <div className="flex flex-wrap gap-2">
                {event.speakers.map((speaker, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {speaker}
                  </span>
                ))}
              </div>
            </div>
          )}

          {event.promotionNeeds && event.promotionNeeds.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Needs</label>
              <div className="flex flex-wrap gap-2">
                {event.promotionNeeds.map((need, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {need}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Event Items */}
        {items.length > 0 && (
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Event Items ({items.length})
            </h3>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  )}
                  {item.metadata && Object.keys(item.metadata).length > 0 && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Metadata:</span> {JSON.stringify(item.metadata)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Event'}
          </button>
          <button
            onClick={onEdit}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Edit
          </button>
          <button
            onClick={onBack}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

