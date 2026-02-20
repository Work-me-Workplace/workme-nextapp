'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { WorkOpsDerivedFrom } from '@prisma/client'
import SmartWorkForm from './SmartWorkForm'
import ManualEntryForm from './forms/ManualEntryForm'

const DERIVED_FROM_OPTIONS: { value: WorkOpsDerivedFrom; label: string }[] = [
  { value: WorkOpsDerivedFrom.my_own, label: 'My own' },
  { value: WorkOpsDerivedFrom.boss, label: 'Boss' },
  { value: WorkOpsDerivedFrom.workforce_comms, label: 'Workforce / company stuff' },
  { value: WorkOpsDerivedFrom.external_pressure, label: 'External pressure' },
  { value: WorkOpsDerivedFrom.personal, label: 'Personal' },
]

interface DynamicFormProps {
  method: 'manual' | 'ai'
  outlookId: string
  onBack: () => void
  onSuccess: () => void
}

export default function DynamicForm({ method, outlookId, onBack, onSuccess }: DynamicFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiDerivedFrom, setAiDerivedFrom] = useState<WorkOpsDerivedFrom>(WorkOpsDerivedFrom.my_own)

  const handleSubmit = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/api/workops/item/create', {
        outlookId,
        ...data,
      })

      if (response.data.success) {
        onSuccess()
      } else {
        setError(response.data.error || 'Failed to create work item')
      }
    } catch (err: any) {
      console.error('Failed to create work item:', err)
      setError(err.response?.data?.error || err.message || 'Failed to create work item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {method === 'manual' && (
        <ManualEntryForm onSubmit={handleSubmit} loading={loading} />
      )}

      {method === 'ai' && (
        <>
          <div className="mb-6">
            <label htmlFor="ai-derivedFrom" className="block text-sm font-medium text-gray-700 mb-2">
              Where is this from?
            </label>
            <select
              id="ai-derivedFrom"
              value={aiDerivedFrom}
              onChange={(e) => setAiDerivedFrom(e.target.value as WorkOpsDerivedFrom)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {DERIVED_FROM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <SmartWorkForm
            derivedFrom={aiDerivedFrom}
            outlookId={outlookId}
            onBack={onBack}
            onSuccess={onSuccess}
          />
        </>
      )}
    </div>
  )
}
