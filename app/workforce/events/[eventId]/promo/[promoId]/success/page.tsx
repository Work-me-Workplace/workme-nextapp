'use client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function PromotionalProductSuccessPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const promoId = params.promoId as string

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Promotional Product Created Successfully!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your promotional product has been saved and is ready for use.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/workforce/events/${eventId}/promo/${promoId}`}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              View Product
            </Link>
            <button
              onClick={() => router.push(`/workforce/events/${eventId}/promo/new`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Create Another Product
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
