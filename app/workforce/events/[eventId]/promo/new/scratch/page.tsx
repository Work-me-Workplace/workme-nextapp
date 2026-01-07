'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense, useCallback } from 'react'
import Link from 'next/link'
// TODO: Migrate to product creation system (ProductDigitalSign or appropriate product type)
// import { createPromotionalWorkItem } from '@/lib/actions/promotional-work-item' // DEPRECATED - EventItem removed

function SearchParamsInitializer({ onParamsLoaded }: { onParamsLoaded: (params: Record<string, string>) => void }) {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    if (searchParams) {
      const params: Record<string, string> = {
        name: searchParams.get('name') || '',
        type: searchParams.get('type') || '',
        title: searchParams.get('title') || '',
        headline: searchParams.get('headline') || '',
        subheadline: searchParams.get('subheadline') || '',
        details: searchParams.get('details') || '',
        perks: searchParams.get('perks') || '',
        participation: searchParams.get('participation') || '',
        foodProvided: searchParams.get('foodProvided') || '',
        foodTypes: searchParams.get('foodTypes') || '',
        theme: searchParams.get('theme') || '',
        eventDateBlock: searchParams.get('eventDateBlock') || '',
        eventTimeBlock: searchParams.get('eventTimeBlock') || '',
        rsvpLink: searchParams.get('rsvpLink') || '',
      }
      
      if (params.name || params.type || params.title) {
        onParamsLoaded(params)
      }
    }
  }, [searchParams, onParamsLoaded])
  
  return null
}

export default function PromotionalProductScratchPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'poster_22x26',
    title: '',
    headline: '',
    subheadline: '',
    details: '',
    perks: '',
    participation: '',
    foodProvided: '',
    foodTypes: '',
    theme: '',
    eventDateBlock: '',
    eventTimeBlock: '',
    rsvpLink: '',
  })

  const handleParamsLoaded = useCallback((params: Record<string, string>) => {
    setFormData({
      name: params.name || '',
      type: params.type || 'poster_22x26',
      title: params.title || '',
      headline: params.headline || '',
      subheadline: params.subheadline || '',
      details: params.details || '',
      perks: params.perks || '',
      participation: params.participation || '',
      foodProvided: params.foodProvided || '',
      foodTypes: params.foodTypes || '',
      theme: params.theme || '',
      eventDateBlock: params.eventDateBlock || '',
      eventTimeBlock: params.eventTimeBlock || '',
      rsvpLink: params.rsvpLink || '',
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Migrate to product creation system
    alert('This feature is being migrated to the new product system. Please use the product creation flow instead.')
    setLoading(false)
    
    /* DEPRECATED - EventItem removed
    setLoading(true)

    try {
      const result = await createPromotionalWorkItem({
        eventId,
        ...formData,
        metadata: null,
      })

      if (result.success && result.promotionalWorkItem) {
        router.push(`/workforce/events/${eventId}/promo/${result.promotionalWorkItem.id}/success`)
      } else {
        alert('Failed to create promotional product: ' + (result.error || 'Unknown error'))
        setLoading(false)
      }
    } catch (error) {
      console.error('Error creating promotional product:', error)
      alert('Failed to create promotional product')
      setLoading(false)
    }
    */
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <SearchParamsInitializer onParamsLoaded={handleParamsLoaded} />
      </Suspense>
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
          href={`/workforce/events/${eventId}/promo/new`} 
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to Creation Options
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Promotional Product (From Scratch)</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Holiday Open House Poster"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="poster_22x26">Poster 22x26</option>
                <option value="flyer_8x11">Flyer 8x11</option>
                <option value="poster_11x17">Poster 11x17</option>
                <option value="banner">Banner</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., HOLIDAY OPEN HOUSE"
              />
            </div>

            <div>
              <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-2">
                Headline
              </label>
              <input
                type="text"
                id="headline"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Main headline"
              />
            </div>

            <div>
              <label htmlFor="subheadline" className="block text-sm font-medium text-gray-700 mb-2">
                Subheadline
              </label>
              <input
                type="text"
                id="subheadline"
                value={formData.subheadline}
                onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Supporting headline"
              />
            </div>

            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <input
                type="text"
                id="theme"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Celebrating the Force Behind the Fleet"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="eventDateBlock" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date Block
                </label>
                <input
                  type="text"
                  id="eventDateBlock"
                  value={formData.eventDateBlock}
                  onChange={(e) => setFormData({ ...formData, eventDateBlock: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Wednesday, December 17"
                />
              </div>

              <div>
                <label htmlFor="eventTimeBlock" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Time Block
                </label>
                <input
                  type="text"
                  id="eventTimeBlock"
                  value={formData.eventTimeBlock}
                  onChange={(e) => setFormData({ ...formData, eventTimeBlock: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 11:30 a.m. – 1:30 p.m."
                />
              </div>
            </div>

            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-2">
                Details
              </label>
              <textarea
                id="details"
                rows={6}
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Event details and description"
              />
            </div>

            <div>
              <label htmlFor="perks" className="block text-sm font-medium text-gray-700 mb-2">
                Perks
              </label>
              <textarea
                id="perks"
                rows={3}
                value={formData.perks}
                onChange={(e) => setFormData({ ...formData, perks: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="List of perks or benefits"
              />
            </div>

            <div>
              <label htmlFor="participation" className="block text-sm font-medium text-gray-700 mb-2">
                Participation
              </label>
              <textarea
                id="participation"
                rows={3}
                value={formData.participation}
                onChange={(e) => setFormData({ ...formData, participation: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="How to participate or what to expect"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="foodProvided" className="block text-sm font-medium text-gray-700 mb-2">
                  Food Provided
                </label>
                <input
                  type="text"
                  id="foodProvided"
                  value={formData.foodProvided}
                  onChange={(e) => setFormData({ ...formData, foodProvided: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Yes or No"
                />
              </div>

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
                  placeholder="e.g., Lunch, snacks, beverages"
                />
              </div>
            </div>

            <div>
              <label htmlFor="rsvpLink" className="block text-sm font-medium text-gray-700 mb-2">
                RSVP Link
              </label>
              <input
                type="url"
                id="rsvpLink"
                value={formData.rsvpLink}
                onChange={(e) => setFormData({ ...formData, rsvpLink: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Paste Microsoft Forms link here"
              />
              <p className="mt-1 text-sm text-gray-500">
                QR code will be generated automatically in Microsoft Forms.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
              <Link
                href={`/workforce/events/${eventId}/promo/new`}
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
