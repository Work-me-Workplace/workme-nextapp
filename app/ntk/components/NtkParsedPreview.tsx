'use client'

import { ParsedNTKInput } from '@/lib/ntk/ntkTypes'

interface NtkParsedPreviewProps {
  parsed: ParsedNTKInput
  onBack: () => void
}

export default function NtkParsedPreview({
  parsed,
  onBack,
}: NtkParsedPreviewProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'deadline-critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
      >
        ← Back
      </button>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Parsed Fields
        </h2>
        <p className="text-gray-600 text-sm">
          Review the extracted fields below. All fields are extracted as-is from the source text.
        </p>
      </div>

      {/* Structured Display */}
      <div className="space-y-4">
        {/* Basic Info */}
        {(parsed.title || parsed.description || parsed.location) && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Basic Information
            </h3>
            <div className="space-y-2">
              {parsed.title && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Title:</span>
                  <p className="text-gray-900">{parsed.title}</p>
                </div>
              )}
              {parsed.description && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Description:</span>
                  <p className="text-gray-700 whitespace-pre-wrap">{parsed.description}</p>
                </div>
              )}
              {parsed.location && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Location:</span>
                  <p className="text-gray-700">{parsed.location}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dates & Times */}
        {(parsed.start_date || parsed.end_date || parsed.deadlines.length > 0) && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Dates & Deadlines
            </h3>
            <div className="space-y-2">
              {parsed.start_date && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Start Date:</span>
                  <p className="text-gray-700">
                    {parsed.start_date}
                    {parsed.start_time && ` at ${parsed.start_time}`}
                  </p>
                </div>
              )}
              {parsed.end_date && (
                <div>
                  <span className="text-sm font-medium text-gray-600">End Date:</span>
                  <p className="text-gray-700">
                    {parsed.end_date}
                    {parsed.end_time && ` at ${parsed.end_time}`}
                  </p>
                </div>
              )}
              {parsed.deadlines.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Deadlines:</span>
                  <ul className="list-disc list-inside mt-1">
                    {parsed.deadlines.map((deadline, idx) => (
                      <li key={idx} className="text-gray-700">{deadline}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* POC */}
        {(parsed.poc_name || parsed.poc_email || parsed.poc_phone) && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Point of Contact
            </h3>
            <div className="space-y-2">
              {parsed.poc_name && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Name:</span>
                  <p className="text-gray-700">{parsed.poc_name}</p>
                </div>
              )}
              {parsed.poc_email && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Email:</span>
                  <p className="text-gray-700">
                    <a href={`mailto:${parsed.poc_email}`} className="text-blue-600 hover:underline">
                      {parsed.poc_email}
                    </a>
                  </p>
                </div>
              )}
              {parsed.poc_phone && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Phone:</span>
                  <p className="text-gray-700">{parsed.poc_phone}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Intent & CTA */}
        {(parsed.intent_phrase || parsed.cta) && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Intent & Call to Action
            </h3>
            <div className="space-y-2">
              {parsed.intent_phrase && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Intent Phrase:</span>
                  <p className="text-gray-700 italic">{parsed.intent_phrase}</p>
                </div>
              )}
              {parsed.cta && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Call to Action:</span>
                  <p className="text-gray-700">{parsed.cta}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Urgency */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Urgency</h3>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(parsed.urgency)}`}
          >
            {parsed.urgency}
          </span>
        </div>

        {/* Links */}
        {parsed.links.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Links</h3>
            <ul className="space-y-1">
              {parsed.links.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Fields */}
        {parsed.missing.length > 0 && (
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fields Not Found in Source
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {parsed.missing.map((field, idx) => (
                <li key={idx} className="text-gray-700 text-sm">{field}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Raw JSON View */}
      <details className="border border-gray-200 rounded-lg">
        <summary className="cursor-pointer p-4 text-sm font-medium text-gray-700 hover:bg-gray-50">
          View Raw JSON
        </summary>
        <pre className="bg-gray-100 p-4 rounded-b-lg text-xs overflow-x-auto">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      </details>
    </div>
  )
}

