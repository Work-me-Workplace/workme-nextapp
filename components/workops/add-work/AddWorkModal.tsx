'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import SourceSelector from './SourceSelector'
import DynamicForm from './DynamicForm'

export type WorkOpsSourceType =
  | 'boss_tasking'
  | 'capture'
  | 'manual'
  | 'bulk'
  | 'workforce_stuff'
  | 'company_milestones'
  | 'employee_highlights'
  | 'products'
  | 'external_pressures'

interface AddWorkModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  outlookId: string
}

export default function AddWorkModal({ isOpen, onClose, onSuccess, outlookId }: AddWorkModalProps) {
  const [step, setStep] = useState<'source' | 'form'>('source')
  const [selectedSource, setSelectedSource] = useState<WorkOpsSourceType | null>(null)

  if (!isOpen) return null

  const handleSourceSelect = (source: WorkOpsSourceType) => {
    setSelectedSource(source)
    setStep('form')
  }

  const handleBack = () => {
    setStep('source')
    setSelectedSource(null)
  }

  const handleSuccess = () => {
    setStep('source')
    setSelectedSource(null)
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'source' ? 'Add Work' : 'Create Work Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'source' ? (
            <SourceSelector onSelect={handleSourceSelect} />
          ) : (
            <DynamicForm
              source={selectedSource!}
              outlookId={outlookId}
              onBack={handleBack}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </div>
    </div>
  )
}

