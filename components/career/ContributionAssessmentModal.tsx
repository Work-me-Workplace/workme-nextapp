'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '@/lib/api'

interface ContributionAssessmentModalProps {
  isOpen: boolean
  onClose: () => void
  companyEventId?: string
  companyCampaignId?: string
  companyTrainingId?: string
  eventTitle?: string
  onSuccess?: () => void
}

export default function ContributionAssessmentModal({
  isOpen,
  onClose,
  companyEventId,
  companyCampaignId,
  companyTrainingId,
  eventTitle,
  onSuccess,
}: ContributionAssessmentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    whatDid: '',
    results: '',
    skillTopicIds: [] as string[], // Skills demonstrated
  })
  const [availableSkills, setAvailableSkills] = useState<Array<{ id: string; title: string }>>([])
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load available skills on mount
  useEffect(() => {
    if (isOpen) {
      loadSkills()
    }
  }, [isOpen])

  async function loadSkills() {
    setLoadingSkills(true)
    try {
      // TODO: Create API endpoint to list SkillTopics
      // For now, empty array - will be populated when API exists
      setAvailableSkills([])
    } catch (err) {
      console.error('Failed to load skills:', err)
    } finally {
      setLoadingSkills(false)
    }
  }

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await api.post('/api/my-contributions', {
        companyEventId,
        companyCampaignId,
        companyTrainingId,
        ...formData,
      })
      
      setFormData({ title: '', description: '', whatDid: '', results: '', skillTopicIds: [] })
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save contribution')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Document Your Contribution
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {eventTitle && (
          <p className="text-sm text-gray-600 mb-4">
            Event: <strong>{eventTitle}</strong>
          </p>
        )}

        <p className="text-sm text-gray-600 mb-6">
          Take a moment to document how you helped impact this event. This helps with your career tracking and appraisals.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Event Planning Lead"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your role..."
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What Did You Do? *
            </label>
            <textarea
              value={formData.whatDid}
              onChange={(e) => setFormData({ ...formData, whatDid: e.target.value })}
              placeholder="Describe what you did to contribute to this event..."
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Results / Impact
            </label>
            <textarea
              value={formData.results}
              onChange={(e) => setFormData({ ...formData, results: e.target.value })}
              placeholder="What were the results or impact of your contribution?"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills Demonstrated (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              What skills did you demonstrate? (e.g., "Workforce Engagement", "Event Coordination")
            </p>
            {loadingSkills ? (
              <p className="text-sm text-gray-500">Loading skills...</p>
            ) : availableSkills.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                Skills feature coming soon - you can add skillTopicIds manually for now
              </p>
            ) : (
              <div className="space-y-2">
                {availableSkills.map((skill) => (
                  <label key={skill.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.skillTopicIds.includes(skill.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            skillTopicIds: [...formData.skillTopicIds, skill.id],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            skillTopicIds: formData.skillTopicIds.filter((id) => id !== skill.id),
                          })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{skill.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={submitting || !formData.whatDid.trim()}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Contribution'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Skip for Now
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
