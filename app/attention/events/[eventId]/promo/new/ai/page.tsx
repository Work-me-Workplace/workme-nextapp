'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { createPromotionalWorkItem } from '@/lib/actions/promotional-work-item'

export default function PromotionalProductAIPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const [rawText, setRawText] = useState('')
  const [productType, setProductType] = useState('poster_22x26')
  const [parsing, setParsing] = useState(false)
  const [parsedData, setParsedData] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [editedData, setEditedData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleParseWithAI = async () => {
    if (!rawText.trim()) {
      setError('Please paste event text')
      return
    }

    setParsing(true)
    setError(null)

    try {
      const response = await fetch('/api/ingest/promotional/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: productType,
          rawText: rawText.trim(),
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        setParsedData(result.data)
        setEditedData(result.data)
      } else {
        setError(result.error || 'Failed to parse with AI')
      }
    } catch (err) {
      console.error('Error parsing with AI:', err)
      setError('Failed to parse with AI. Please try again.')
    } finally {
      setParsing(false)
    }
  }

  const handleSave = async () => {
    const dataToSave = editing ? editedData : parsedData
    if (!dataToSave) return

    setSaving(true)
    try {
      const result = await createPromotionalWorkItem({
        eventId,
        name: dataToSave.name || 'Untitled Product',
        type: dataToSave.type || productType,
        title: dataToSave.title || null,
        headline: dataToSave.headline || null,
        subheadline: dataToSave.subheadline || null,
        details: dataToSave.details || null,
        perks: dataToSave.perks || null,
        participation: dataToSave.participation || null,
        foodProvided: dataToSave.foodProvided || null,
        foodTypes: dataToSave.foodTypes || null,
        theme: dataToSave.theme || null,
        eventDateBlock: dataToSave.eventDateBlock || null,
        eventTimeBlock: dataToSave.eventTimeBlock || null,
        rsvpLink: dataToSave.rsvpLink || null,
        metadata: dataToSave.metadata || null,
      })

      if (result.success && result.promotionalWorkItem) {
        router.push(`/attention/events/${eventId}/promo/${result.promotionalWorkItem.id}/success`)
      } else {
        alert('Failed to save: ' + (result.error || 'Unknown error'))
        setSaving(false)
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save')
      setSaving(false)
    }
  }

  const renderPreview = (data: any) => {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 font-serif">
        <div className="text-center space-y-4">
          {data.title && (
            <h1 className="text-3xl font-bold uppercase tracking-wide">{data.title}</h1>
          )}
          {data.theme && (
            <p className="text-lg italic text-gray-700">"{data.theme}"</p>
          )}
          {data.headline && (
            <h2 className="text-2xl font-semibold">{data.headline}</h2>
          )}
          {data.subheadline && (
            <h3 className="text-xl text-gray-700">{data.subheadline}</h3>
          )}
          {(data.eventDateBlock || data.eventTimeBlock) && (
            <div className="text-lg">
              {data.eventDateBlock && <p className="font-semibold">{data.eventDateBlock}</p>}
              {data.eventTimeBlock && <p>{data.eventTimeBlock}</p>}
            </div>
          )}
          {data.details && (
            <div className="text-left mt-4">
              <p className="whitespace-pre-wrap">{data.details}</p>
            </div>
          )}
          {data.perks && (
            <div className="text-left mt-4">
              <p className="font-semibold">Perks:</p>
              <p className="whitespace-pre-wrap">{data.perks}</p>
            </div>
          )}
          {data.participation && (
            <div className="text-left mt-4">
              <p className="font-semibold">Participation:</p>
              <p className="whitespace-pre-wrap">{data.participation}</p>
            </div>
          )}
          {(data.foodProvided || data.foodTypes) && (
            <div className="text-left mt-4">
              <p className="font-semibold">Food:</p>
              <p>{data.foodProvided} {data.foodTypes && `— ${data.foodTypes}`}</p>
            </div>
          )}
          {data.rsvpLink && (
            <div className="text-left mt-4">
              <p className="font-semibold">RSVP:</p>
              <a href={data.rsvpLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {data.rsvpLink}
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (parsedData && !editing) {
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
          <div className="bg-white rounded-lg shadow p-8">
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Product parsed successfully! Review the preview below.
              </p>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Review & Confirm</h2>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Edit Fields
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">CVI Preview</h3>
              {renderPreview(parsedData)}
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Confirm & Save'}
              </button>
              <button
                onClick={() => {
                  setParsedData(null)
                  setEditedData(null)
                }}
                disabled={saving}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Parse Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (editing && editedData) {
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
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Fields</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editedData.title || ''}
                  onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <input
                  type="text"
                  value={editedData.headline || ''}
                  onChange={(e) => setEditedData({ ...editedData, headline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                <input
                  type="text"
                  value={editedData.subheadline || ''}
                  onChange={(e) => setEditedData({ ...editedData, subheadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                <input
                  type="text"
                  value={editedData.theme || ''}
                  onChange={(e) => setEditedData({ ...editedData, theme: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Date Block</label>
                  <input
                    type="text"
                    value={editedData.eventDateBlock || ''}
                    onChange={(e) => setEditedData({ ...editedData, eventDateBlock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Time Block</label>
                  <input
                    type="text"
                    value={editedData.eventTimeBlock || ''}
                    onChange={(e) => setEditedData({ ...editedData, eventTimeBlock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                <textarea
                  rows={6}
                  value={editedData.details || ''}
                  onChange={(e) => setEditedData({ ...editedData, details: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perks</label>
                <textarea
                  rows={3}
                  value={editedData.perks || ''}
                  onChange={(e) => setEditedData({ ...editedData, perks: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Participation</label>
                <textarea
                  rows={3}
                  value={editedData.participation || ''}
                  onChange={(e) => setEditedData({ ...editedData, participation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Food Provided</label>
                  <input
                    type="text"
                    value={editedData.foodProvided || ''}
                    onChange={(e) => setEditedData({ ...editedData, foodProvided: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Food Types</label>
                  <input
                    type="text"
                    value={editedData.foodTypes || ''}
                    onChange={(e) => setEditedData({ ...editedData, foodTypes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RSVP Link</label>
                <input
                  type="url"
                  value={editedData.rsvpLink || ''}
                  onChange={(e) => setEditedData({ ...editedData, rsvpLink: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Paste Microsoft Forms link"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 mt-6 border-t">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Save & Preview
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setEditedData(parsedData)
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI-Assisted Product Creation</h2>
          <p className="text-gray-600 mb-4">Paste your event details and let AI structure it into a promotional product brief.</p>

          <div className="space-y-6">
            <div>
              <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-2">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                id="productType"
                required
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="poster_22x26">Poster 22x26</option>
                <option value="flyer_8x11">Flyer 8x11</option>
                <option value="poster_11x17">Poster 11x17</option>
                <option value="banner">Banner</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-2">
                Event Text (Copy/Paste) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rawText"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Paste your event details, agenda, dates, times, and other information here..."
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm p-4 bg-red-50 border border-red-200 rounded-lg">{error}</div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleParseWithAI}
                disabled={parsing || !rawText.trim()}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {parsing ? 'Parsing...' : 'Parse With AI'}
              </button>
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
    </div>
  )
}
