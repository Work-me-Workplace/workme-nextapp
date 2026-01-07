'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
// TODO: Migrate to product creation system
// import { getPromotionalWorkItem } from '@/lib/actions/promotional-work-item' // DEPRECATED - EventItem removed

export default function PromotionalProductViewPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const promoId = params.promoId as string
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    // TODO: Migrate to product system - this feature is deprecated
    setLoading(false)
    // Note: This page needs to be migrated to use product system
    
    /* DEPRECATED - EventItem removed
    const loadItem = async () => {
      setLoading(true)
      try {
        const result = await getPromotionalWorkItem(promoId)
        if (result.success && result.item) {
          setItem(result.item)
        } else {
          console.error('Failed to load item:', result.error)
        }
      } catch (error) {
        console.error('Error loading item:', error)
      } finally {
        setLoading(false)
      }
    }
    loadItem()
    */
  }, [promoId])

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const getCVIReadyText = () => {
    if (!item) return ''
    return `${item.title || 'EVENT'}

"${item.theme || ''}"

${item.headline || ''}
${item.subheadline || ''}

${item.eventDateBlock || ''}
${item.eventTimeBlock || ''}

${item.details || ''}

Perks:
${item.perks || ''}

Participation:
${item.participation || ''}

Food:
${item.foodProvided || ''} — ${item.foodTypes || ''}

RSVP:
${item.rsvpLink || ''}`
  }

  const getSharePointSummary = () => {
    if (!item) return ''
    return `${item.headline || ''}

${item.subheadline || ''}

${item.details || ''}

${item.eventDateBlock || ''} ${item.eventTimeBlock || ''}`
  }

  const getEmailSnippet = () => {
    if (!item) return ''
    const subject = `Join us for ${item.title || 'our event'}`
    const body = `You're invited to ${item.title || 'our event'}!

${item.headline || ''}

${item.subheadline || ''}

${item.details?.substring(0, 200) || ''}${item.details && item.details.length > 200 ? '...' : ''}

${item.eventDateBlock || ''} ${item.eventTimeBlock || ''}

${item.rsvpLink ? `RSVP: ${item.rsvpLink}` : ''}`
    return `Subject: ${subject}\n\n${body}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600">Product not found</p>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => window.history.back()}
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
              <p className="text-sm text-gray-600 mt-1">{item.type}</p>
            </div>
          </div>

          {/* Export Utilities */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Utilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => copyToClipboard(getCVIReadyText(), 'text')}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {copied === 'text' ? '✓ Copied!' : 'Copy Text'}
              </button>
              <button
                onClick={() => copyToClipboard(getSharePointSummary(), 'sharepoint')}
                className="px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                {copied === 'sharepoint' ? '✓ Copied!' : 'Copy SharePoint Summary'}
              </button>
              <button
                onClick={() => copyToClipboard(getEmailSnippet(), 'email')}
                className="px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                {copied === 'email' ? '✓ Copied!' : 'Copy Email Snippet'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 font-serif">
              <div className="text-center space-y-4">
                {item.title && (
                  <h1 className="text-3xl font-bold uppercase tracking-wide">{item.title}</h1>
                )}
                {item.theme && (
                  <p className="text-lg italic text-gray-700">"{item.theme}"</p>
                )}
                {item.headline && (
                  <h2 className="text-2xl font-semibold">{item.headline}</h2>
                )}
                {item.subheadline && (
                  <h3 className="text-xl text-gray-700">{item.subheadline}</h3>
                )}
                {(item.eventDateBlock || item.eventTimeBlock) && (
                  <div className="text-lg">
                    {item.eventDateBlock && <p className="font-semibold">{item.eventDateBlock}</p>}
                    {item.eventTimeBlock && <p>{item.eventTimeBlock}</p>}
                  </div>
                )}
                {item.details && (
                  <div className="text-left mt-4">
                    <p className="whitespace-pre-wrap">{item.details}</p>
                  </div>
                )}
                {item.perks && (
                  <div className="text-left mt-4">
                    <p className="font-semibold">Perks:</p>
                    <p className="whitespace-pre-wrap">{item.perks}</p>
                  </div>
                )}
                {item.participation && (
                  <div className="text-left mt-4">
                    <p className="font-semibold">Participation:</p>
                    <p className="whitespace-pre-wrap">{item.participation}</p>
                  </div>
                )}
                {(item.foodProvided || item.foodTypes) && (
                  <div className="text-left mt-4">
                    <p className="font-semibold">Food:</p>
                    <p>{item.foodProvided} {item.foodTypes && `— ${item.foodTypes}`}</p>
                  </div>
                )}
                {item.rsvpLink && (
                  <div className="text-left mt-4">
                    <p className="font-semibold">RSVP:</p>
                    <a href={item.rsvpLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {item.rsvpLink}
                    </a>
                    <div className="mt-2 p-4 bg-gray-100 border border-gray-300 rounded-lg text-center">
                      <p className="text-sm text-gray-600">QR Code Placeholder</p>
                      <p className="text-xs text-gray-500 mt-1">QR will be generated automatically in Microsoft Forms.</p>
                    </div>
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

