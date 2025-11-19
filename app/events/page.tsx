import Link from 'next/link'

export default function EventsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Events & Networking</h2>
          <p className="text-gray-600 mt-2">Track conferences, meetups, and networking opportunities</p>
        </div>
        <Link 
          href="/events/new" 
          className="rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition"
        >
          Add Event
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-500 mb-4">
          Track networking events, conferences, workshops, and other professional gatherings.
        </p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 mb-4">No events yet</p>
          <Link 
            href="/events/new" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first event →
          </Link>
        </div>
      </div>
    </div>
  )
}

