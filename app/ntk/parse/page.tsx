'use client'

import { useState } from 'react'
import NtkInputForm from '../components/NtkInputForm'
import NtkParsedPreview from '../components/NtkParsedPreview'
import { ParsedNTKInput } from '@/lib/ntk/ntkTypes'

/**
 * NTK Parser MVP Page
 * 
 * Simple paste → parse → preview flow
 * This is ONLY the parser step - no generator, no context engine
 */
export default function NtkParsePage() {
  const [parsed, setParsed] = useState<ParsedNTKInput | null>(null)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          NTK Parser MVP
        </h1>
        <p className="text-gray-600">
          Paste raw communication text to extract structured fields.
        </p>
      </div>

      {!parsed && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <NtkInputForm onParsed={setParsed} />
        </div>
      )}

      {parsed && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <NtkParsedPreview
            parsed={parsed}
            onBack={() => setParsed(null)}
          />
        </div>
      )}
    </div>
  )
}

