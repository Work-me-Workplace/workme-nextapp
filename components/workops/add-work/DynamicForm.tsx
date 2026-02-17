'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import type { WorkOpsSourceType } from './AddWorkModal'
import { WorkOpsItemType, WorkOpsUrgency, WorkOpsSource } from '@prisma/client'
import SmartWorkForm from './SmartWorkForm'
import BossTaskingForm from './forms/BossTaskingForm'
import CaptureForm from './forms/CaptureForm'
import ManualEntryForm from './forms/ManualEntryForm'
import BulkAddForm from './forms/BulkAddForm'
import WorkforceStuffForm from './forms/WorkforceStuffForm'
import CompanyMilestonesForm from './forms/CompanyMilestonesForm'
import EmployeeHighlightsForm from './forms/EmployeeHighlightsForm'
import ProductsForm from './forms/ProductsForm'
import ExternalPressuresForm from './forms/ExternalPressuresForm'

interface DynamicFormProps {
  source: WorkOpsSourceType
  outlookId: string
  onBack: () => void
  onSuccess: () => void
}

export default function DynamicForm({ source, outlookId, onBack, onSuccess }: DynamicFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        Back to source selection
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* New 3-pronged approach with AI */}
      {source === 'capture' && (
        <SmartWorkForm 
          category="my_thoughts" 
          outlookId={outlookId} 
          onBack={onBack} 
          onSuccess={onSuccess} 
        />
      )}
      {source === 'boss_tasking' && (
        <SmartWorkForm 
          category="boss" 
          outlookId={outlookId} 
          onBack={onBack} 
          onSuccess={onSuccess} 
        />
      )}
      {source === 'workforce_stuff' && (
        <SmartWorkForm 
          category="company_stuff" 
          outlookId={outlookId} 
          onBack={onBack} 
          onSuccess={onSuccess} 
        />
      )}

      {/* Quick add (manual fields) and bulk (paste list, no AI) */}
      {source === 'manual' && (
        <ManualEntryForm onSubmit={handleSubmit} loading={loading} />
      )}
      {source === 'bulk' && (
        <BulkAddForm onBack={onBack} onSuccess={onSuccess} />
      )}

      {/* Legacy forms (keeping for backward compatibility) */}
      {source === 'company_milestones' && (
        <CompanyMilestonesForm onSubmit={handleSubmit} loading={loading} />
      )}
      {source === 'employee_highlights' && (
        <EmployeeHighlightsForm onSubmit={handleSubmit} loading={loading} />
      )}
      {source === 'products' && (
        <ProductsForm onSubmit={handleSubmit} loading={loading} />
      )}
      {source === 'external_pressures' && (
        <ExternalPressuresForm onSubmit={handleSubmit} loading={loading} />
      )}
    </div>
  )
}

