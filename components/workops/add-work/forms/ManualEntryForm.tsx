'use client'

import { useState } from 'react'
import { WorkOpsItemType, WorkOpsUrgency, WorkOpsSource } from '@prisma/client'

interface ManualEntryFormProps {
  onSubmit: (data: any) => void
  loading: boolean
}

const itemTypeOptions = [
  { value: WorkOpsItemType.task, label: 'Task' },
  { value: WorkOpsItemType.admin, label: 'Admin' },
  { value: WorkOpsItemType.tech_work, label: 'Tech Work' },
  { value: WorkOpsItemType.personal, label: 'Personal' },
  { value: WorkOpsItemType.workforce_comms, label: 'Workforce Comms' },
]

export default function ManualEntryForm({ onSubmit, loading }: ManualEntryFormProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [itemType, setItemType] = useState<WorkOpsItemType>(WorkOpsItemType.task)
  const [urgency, setUrgency] = useState<WorkOpsUrgency | ''>('')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSubmit({
      title: title.trim(),
      body: body.trim() || null,
      itemType,
      source: WorkOpsSource.manual,
      urgency: urgency || null,
      dueDate: dueDate || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
          Body
        </label>
        <textarea
          id="body"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 mb-2">
          Item Type
        </label>
        <select
          id="itemType"
          value={itemType}
          onChange={(e) => setItemType(e.target.value as WorkOpsItemType)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {itemTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
          Urgency
        </label>
        <select
          id="urgency"
          value={urgency}
          onChange={(e) => setUrgency(e.target.value as WorkOpsUrgency | '')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">None</option>
          <option value={WorkOpsUrgency.low}>Low</option>
          <option value={WorkOpsUrgency.medium}>Medium</option>
          <option value={WorkOpsUrgency.high}>High</option>
          <option value={WorkOpsUrgency.critical}>Critical</option>
        </select>
      </div>

      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
          Due Date
        </label>
        <input
          type="date"
          id="dueDate"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Work Item'}
        </button>
      </div>
    </form>
  )
}

