'use client'

import { NTKStructure } from '@/lib/services/ntk-generator'

interface NTKPreviewProps {
  ntk: NTKStructure
  sourceText?: string
  onSave?: () => void
  onEdit?: () => void
  isLoading?: boolean
}

export default function NTKPreview({
  ntk,
  sourceText,
  onSave,
  onEdit,
  isLoading = false,
}: NTKPreviewProps) {
  return (
    <div className="space-y-6">
      {/* NAVSEA Format: Header, POC, Summary */}
      <div className="border-b pb-4 space-y-3">
        {/* Header Line (NAVSEA format) */}
        {ntk.header ? (
          <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">
            {ntk.header}
          </h2>
        ) : (
          <h2 className="text-2xl font-bold text-gray-900">{ntk.title}</h2>
        )}

        {/* POC (in markdown italics) */}
        {ntk.poc && (
          <div 
            className="text-gray-700"
            dangerouslySetInnerHTML={{ __html: ntk.poc.replace(/\*(.*?)\*/g, '<em>$1</em>') }}
          />
        )}

        {/* Summary (NAVSEA tone, 2-4 sentences) */}
        {ntk.summary && (
          <p className="text-gray-700 leading-relaxed">{ntk.summary}</p>
        )}
      </div>

      {/* Key Points */}
      {ntk.keyPoints && ntk.keyPoints.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Points</h3>
          <ul className="space-y-2">
            {ntk.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {ntk.actionItems && ntk.actionItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Action Items</h3>
          <ul className="space-y-2">
            {ntk.actionItems.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Deadline */}
      {ntk.deadline && ntk.deadline !== 'None' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⏰</span>
            <span className="font-semibold text-gray-900">Deadline:</span>
            <span className="ml-2 text-gray-700">{ntk.deadline}</span>
          </div>
        </div>
      )}

      {/* Contact Info */}
      {ntk.contactInfo && (
        (ntk.contactInfo.name || ntk.contactInfo.email || ntk.contactInfo.phone) && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="space-y-1 text-gray-700">
              {ntk.contactInfo.name && <div>Name: {ntk.contactInfo.name}</div>}
              {ntk.contactInfo.email && <div>Email: {ntk.contactInfo.email}</div>}
              {ntk.contactInfo.phone && <div>Phone: {ntk.contactInfo.phone}</div>}
            </div>
          </div>
        )
      )}

      {/* Related Links */}
      {ntk.relatedLinks && ntk.relatedLinks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Related Links</h3>
          <ul className="space-y-1">
            {ntk.relatedLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {ntk.tags && ntk.tags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {ntk.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source Text (Collapsible) */}
      {sourceText && (
        <details className="border-t pt-4">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            View Source Text
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm text-gray-700">{sourceText}</pre>
          </div>
        </details>
      )}

      {/* Actions */}
      {(onSave || onEdit) && (
        <div className="flex gap-4 pt-4 border-t">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save NTK'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

