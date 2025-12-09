'use client'

import { useState } from 'react'
import { WorkOpsItemType, WorkOpsUrgency, WorkOpsSource } from '@prisma/client'

interface BossTaskingFormProps {
  onSubmit: (data: any) => void
  loading: boolean
}

export default function BossTaskingForm({ onSubmit, loading }: BossTaskingFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState<WorkOpsUrgency>(WorkOpsUrgency.medium)
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSubmit({
      title: title.trim(),
      body: description.trim() || null,
      itemType: WorkOpsItemType.boss_request,
      source: WorkOpsSource.boss,
      urgency,
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
          placeholder="Task title from your boss"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Additional details or context"
        />
      </div>

      <div>
        <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
          Urgency
        </label>
        <select
          id="urgency"
          value={urgency}
          onChange={(e) => setUrgency(e.target.value as WorkOpsUrgency)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
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

