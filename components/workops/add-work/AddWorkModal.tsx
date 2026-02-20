'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { AddTaskMethod } from './MethodSelector'
import MethodSelector from './MethodSelector'
import DynamicForm from './DynamicForm'

interface AddWorkModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  outlookId: string
}

export default function AddWorkModal({ isOpen, onClose, onSuccess, outlookId }: AddWorkModalProps) {
  const [step, setStep] = useState<'method' | 'form'>('method')
  const [method, setMethod] = useState<AddTaskMethod | null>(null)

  if (!isOpen) return null

  const handleMethodSelect = (m: AddTaskMethod) => {
    setMethod(m)
    setStep('form')
  }

  const handleBack = () => {
    setStep('method')
    setMethod(null)
  }

  const handleSuccess = () => {
    setStep('method')
    setMethod(null)
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'method' ? 'Add a task' : method === 'ai' ? 'Add task (AI)' : 'Add task (manual)'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'method' ? (
            <MethodSelector onSelect={handleMethodSelect} />
          ) : method === 'manual' ? (
            <DynamicForm
              method="manual"
              outlookId={outlookId}
              onBack={handleBack}
              onSuccess={handleSuccess}
            />
          ) : (
            <DynamicForm
              method="ai"
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
