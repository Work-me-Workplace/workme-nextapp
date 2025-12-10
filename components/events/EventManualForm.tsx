'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createEvent } from '@/lib/actions/companyx'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import type { ParsedEventItem } from '@/lib/types/event-ingestion'
import { EVENT_AUDIENCE_OPTIONS } from '@/config/event-audience'
import { EVENT_CATEGORY_OPTIONS } from '@/config/event-category'
import type { EventAudience, EventCategory } from '@prisma/client'

interface EventFormData {
  title: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  location: string
  eventCategory: EventCategory | ''
  audience: EventAudience | ''
  pocFirstName: string
  pocLastName: string
  pocEmail: string
  pocPhone: string
  // New fields
  eventDate: string
  registrationRequired: string
  registrationLink: string
  speakers: string[]
  foodProvided: string
  foodTypes: string
  promotionNeeds: string[]
}

interface EventManualFormProps {
  initialData?: Partial<EventFormData>
  initialEventItems?: ParsedEventItem[]
  onBack?: () => void
}

export default function EventManualForm({ initialData, initialEventItems, onBack }: EventManualFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [eventItems, setEventItems] = useState<ParsedEventItem[]>(initialEventItems || [])
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    startDate: initialData?.startDate || '',
    startTime: initialData?.startTime || '',
    endDate: initialData?.endDate || '',
    endTime: initialData?.endTime || '',
    location: initialData?.location || '',
    eventCategory: (initialData?.eventCategory as EventCategory) || '',
    audience: (initialData?.audience as EventAudience) || '',
    pocFirstName: initialData?.pocFirstName || '',
    pocLastName: initialData?.pocLastName || '',
    pocEmail: initialData?.pocEmail || '',
    pocPhone: initialData?.pocPhone || '',
    eventDate: initialData?.eventDate || '',
    registrationRequired: initialData?.registrationRequired || '',
    registrationLink: initialData?.registrationLink || '',
    speakers: initialData?.speakers || [],
    foodProvided: initialData?.foodProvided || '',
    foodTypes: initialData?.foodTypes || '',
    promotionNeeds: initialData?.promotionNeeds || [],
  })

  const [speakerInput, setSpeakerInput] = useState('')
  const [promotionInput, setPromotionInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!getWorkMeIdFromStorage()) {
      router.push('/signin')
      return
    }

    setLoading(true)
    try {
      const result = await createEvent({
        title: formData.title,
        description: formData.description || null,
        eventDate: formData.eventDate ? new Date(formData.eventDate) : null,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        eventCategory: (formData.eventCategory || null) as EventCategory | null,
        audience: (formData.audience || null) as EventAudience | null,
        pocEmail: formData.pocEmail || null,
        pocPhone: formData.pocPhone || null,
        registrationRequired: formData.registrationRequired || null,
        registrationLink: formData.registrationLink || null,
        speakers: formData.speakers.length > 0 ? formData.speakers : undefined,
        foodProvided: formData.foodProvided || null,
        foodTypes: formData.foodTypes || null,
      })

      if (result.success && result.event) {
        // Store in localStorage for instant hydration
        const eventId = result.event.id
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastCreatedEventId', eventId)
          
          // Refresh events list in background
          const companyUnit = localStorage.getItem('companyUnit')
          if (companyUnit) {
            window.dispatchEvent(new CustomEvent('refreshEvents'))
          }
        }
        
        // Navigate directly to view page
        router.push(`/workforce/events/${eventId}/view`)
      } else {
        alert('Failed to create Event: ' + (result.error || 'Unknown error'))
        setLoading(false)
      }
    } catch (error) {
      console.error('Error creating Event:', error)
      alert('Failed to create Event')
      setLoading(false)
    }
  }

  const addSpeaker = () => {
    if (speakerInput.trim()) {
      setFormData({ ...formData, speakers: [...formData.speakers, speakerInput.trim()] })
      setSpeakerInput('')
    }
  }

  const removeSpeaker = (index: number) => {
    setFormData({ ...formData, speakers: formData.speakers.filter((_, i) => i !== index) })
  }

  const addPromotionNeed = () => {
    if (promotionInput.trim()) {
      setFormData({ ...formData, promotionNeeds: [...formData.promotionNeeds, promotionInput.trim()] })
      setPromotionInput('')
    }
  }

  const removePromotionNeed = (index: number) => {
    setFormData({ ...formData, promotionNeeds: formData.promotionNeeds.filter((_, i) => i !== index) })
  }

  return (
    <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ← Change method
          </button>
        )}
      </div>

      {eventItems.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">
            Event Items Found ({eventItems.length})
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {eventItems.map((item, index) => (
              <div key={index} className="text-sm text-blue-800">
                <span className="font-medium">• {item.title}</span>
                {item.description && (
                  <span className="text-blue-600 ml-2">- {item.description.substring(0, 60)}...</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Note: Event items will be saved when you create the event.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
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
          />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                id="startTime"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                id="endTime"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Physical location or virtual"
          />
        </div>

        <div>
          <label htmlFor="eventCategory" className="block text-sm font-medium text-gray-700 mb-2">
            Event Category
          </label>
          <select
            id="eventCategory"
            value={formData.eventCategory}
            onChange={(e) => setFormData({ ...formData, eventCategory: e.target.value as EventCategory | '' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select category...</option>
            {EVENT_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience
          </label>
          <select
            id="audience"
            value={formData.audience}
            onChange={(e) => setFormData({ ...formData, audience: e.target.value as EventAudience | '' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select audience...</option>
            {EVENT_AUDIENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* New Fields */}
        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-2">
            Event Date
          </label>
          <input
            type="date"
            id="eventDate"
            value={formData.eventDate}
            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="registrationRequired" className="block text-sm font-medium text-gray-700 mb-2">
            Registration Required
          </label>
          <select
            id="registrationRequired"
            value={formData.registrationRequired}
            onChange={(e) => setFormData({ ...formData, registrationRequired: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {formData.registrationRequired === 'Yes' && (
          <div>
            <label htmlFor="registrationLink" className="block text-sm font-medium text-gray-700 mb-2">
              Registration Link
            </label>
            <input
              type="url"
              id="registrationLink"
              value={formData.registrationLink}
              onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://..."
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Speakers
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={speakerInput}
              onChange={(e) => setSpeakerInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpeaker())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter speaker name"
            />
            <button
              type="button"
              onClick={addSpeaker}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Add
            </button>
          </div>
          {formData.speakers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.speakers.map((speaker, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {speaker}
                  <button
                    type="button"
                    onClick={() => removeSpeaker(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="foodProvided" className="block text-sm font-medium text-gray-700 mb-2">
            Food Provided
          </label>
          <select
            id="foodProvided"
            value={formData.foodProvided}
            onChange={(e) => setFormData({ ...formData, foodProvided: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {formData.foodProvided === 'Yes' && (
          <div>
            <label htmlFor="foodTypes" className="block text-sm font-medium text-gray-700 mb-2">
              Food Types
            </label>
            <input
              type="text"
              id="foodTypes"
              value={formData.foodTypes}
              onChange={(e) => setFormData({ ...formData, foodTypes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Vegetarian, Gluten-free, etc."
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Promotion Needs
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={promotionInput}
              onChange={(e) => setPromotionInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPromotionNeed())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter promotion need"
            />
            <button
              type="button"
              onClick={addPromotionNeed}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Add
            </button>
          </div>
          {formData.promotionNeeds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.promotionNeeds.map((need, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {need}
                  <button
                    type="button"
                    onClick={() => removePromotionNeed(index)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Point of Contact</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pocFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                POC First Name
              </label>
              <input
                type="text"
                id="pocFirstName"
                value={formData.pocFirstName}
                onChange={(e) => setFormData({ ...formData, pocFirstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="pocLastName" className="block text-sm font-medium text-gray-700 mb-2">
                POC Last Name
              </label>
              <input
                type="text"
                id="pocLastName"
                value={formData.pocLastName}
                onChange={(e) => setFormData({ ...formData, pocLastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="pocEmail" className="block text-sm font-medium text-gray-700 mb-2">
                POC Email
              </label>
              <input
                type="email"
                id="pocEmail"
                value={formData.pocEmail}
                onChange={(e) => setFormData({ ...formData, pocEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="pocPhone" className="block text-sm font-medium text-gray-700 mb-2">
                POC Phone (optional)
              </label>
              <input
                type="tel"
                id="pocPhone"
                value={formData.pocPhone}
                onChange={(e) => setFormData({ ...formData, pocPhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
          <Link
            href="/mywork/context/new"
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

