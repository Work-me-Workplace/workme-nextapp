'use client'

import { useState, useEffect } from 'react'
import EventManualForm from './EventManualForm'
import { getWorkContexts } from '@/lib/actions/work-context'

interface EventTemplatePickerProps {
  onBack: () => void
}

export default function EventTemplatePicker({ onBack }: EventTemplatePickerProps) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const result = await getWorkContexts()
      if (result.success && result.workContexts) {
        // Filter to only event type contexts
        const eventContexts = result.workContexts.filter(
          (ctx: any) => ctx.type === 'event' && ctx.typedData
        )
        setEvents(eventContexts)
      }
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event)
  }

  // If event is selected, show form with pre-filled data
  if (selectedEvent && selectedEvent.typedData) {
    const typedData = selectedEvent.typedData
    const formData = {
      title: typedData.title || '',
      description: typedData.description || '',
      startDate: typedData.startDate ? new Date(typedData.startDate).toISOString().split('T')[0] : '',
      startTime: typedData.startTime || '',
      endDate: typedData.endDate ? new Date(typedData.endDate).toISOString().split('T')[0] : '',
      endTime: typedData.endTime || '',
      location: typedData.location || '',
      eventCategory: typedData.eventCategory || '',
      pocFirstName: typedData.pocFirstName || '',
      pocLastName: typedData.pocLastName || '',
      pocEmail: typedData.pocEmail || '',
      pocPhone: typedData.pocPhone || '',
      eventDate: typedData.eventDate ? new Date(typedData.eventDate).toISOString().split('T')[0] : '',
      registrationRequired: typedData.registrationRequired || '',
      registrationLink: typedData.registrationLink || '',
      speakers: typedData.speakers || [],
      foodProvided: typedData.foodProvided || '',
      foodTypes: typedData.foodTypes || '',
      promotionNeeds: typedData.promotionNeeds || [],
    }

    return (
      <div>
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            ✓ Using "{typedData.title}" as template. Edit the fields below to create a new event.
          </p>
        </div>
        <EventManualForm 
          initialData={formData} 
          onBack={() => setSelectedEvent(null)} 
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Start From Previous Event</h2>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Change method
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No previous events found.</p>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Go back to choose another method
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Select an event to use as a template. You can edit all fields before creating a new event.
          </p>
          
          <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
            {events.map((event) => {
              const typedData = event.typedData || {}
              const eventDate = typedData.startDate 
                ? new Date(typedData.startDate).toLocaleDateString()
                : typedData.eventDate
                  ? new Date(typedData.eventDate).toLocaleDateString()
                  : 'No date'
              
              return (
                <button
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {typedData.title || 'Untitled Event'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {typedData.description ? typedData.description.substring(0, 100) + '...' : 'No description'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>📅 {eventDate}</span>
                        {typedData.location && <span>📍 {typedData.location}</span>}
                        {typedData.eventCategory && <span>🏷️ {typedData.eventCategory}</span>}
                      </div>
                    </div>
                    <svg 
                      className="w-5 h-5 text-green-600 ml-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

