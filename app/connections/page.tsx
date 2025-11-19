import Link from 'next/link'

export default function ConnectionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Connections</h2>
          <p className="text-gray-600 mt-2">Build and nurture your professional network</p>
        </div>
        <Link 
          href="/connections/new" 
          className="rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition"
        >
          Add Connection
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-500 mb-4">
          Your professional connections will appear here. Track mentors, industry contacts, alumni, and more.
        </p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 mb-4">No connections yet</p>
          <Link 
            href="/connections/new" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first connection →
          </Link>
        </div>
      </div>
    </div>
  )
}

