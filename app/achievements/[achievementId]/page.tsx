'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getAchievement, updateAchievement } from '@/lib/actions/achievements'
import { getObjectives } from '@/lib/actions/objectives'
import { getCommsOutputs } from '@/lib/actions/comms-outputs'

const categories = [
  'INTERNAL_COMMS',
  'WORKFORCE_COMMS',
  'EVENT_SUPPORT',
  'EXECUTIVE_LEADERSHIP',
  'OPERATIONS_SUPPORT',
  'READINESS',
  'ADMIN',
  'COMMUNITY_ENGAGEMENT',
]

const categoryLabels: { [key: string]: string } = {
  INTERNAL_COMMS: 'Internal Comms',
  WORKFORCE_COMMS: 'Workforce Comms',
  EVENT_SUPPORT: 'Event Support',
  EXECUTIVE_LEADERSHIP: 'Executive Leadership',
  OPERATIONS_SUPPORT: 'Operations Support',
  READINESS: 'Readiness',
  ADMIN: 'Admin',
  COMMUNITY_ENGAGEMENT: 'Community Engagement',
}

export default function EditAchievementPage() {
  const router = useRouter()
  const params = useParams()
  const achievementId = params.achievementId as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [objectives, setObjectives] = useState<any[]>([])
  const [commsOutputs, setCommsOutputs] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    category: 'INTERNAL_COMMS',
    audienceName: '',
    audienceSize: '',
    objectiveId: '',
    whatYouDid: '',
    frequency: '',
    volume: '',
    commsOutputId: '',
    processSteps: '',
    impact: '',
  })

  useEffect(() => {
    loadData()
  }, [achievementId])

  async function loadData() {
    setLoading(true)
    const [achResult, objResult, commsResult] = await Promise.all([
      getAchievement(achievementId),
      getObjectives(),
      getCommsOutputs(),
    ])

    if (achResult.success && achResult.achievement) {
      const ach = achResult.achievement
      setFormData({
        title: ach.title || '',
        category: ach.category || 'INTERNAL_COMMS',
        audienceName: ach.audienceName || '',
        audienceSize: ach.audienceSize?.toString() || '',
        objectiveId: ach.objectiveId || '',
        whatYouDid: ach.whatYouDid || '',
        frequency: ach.frequency || '',
        volume: ach.volume?.toString() || '',
        commsOutputId: ach.commsOutputId || '',
        processSteps: Array.isArray(ach.processSteps) 
          ? JSON.stringify(ach.processSteps) 
          : (ach.processSteps ? String(ach.processSteps) : ''),
        impact: ach.impact || '',
      })
    } else {
      alert('Achievement not found')
      router.push('/achievements')
      return
    }

    if (objResult.success) setObjectives(objResult.objectives || [])
    if (commsResult.success) setCommsOutputs(commsResult.commsOutputs || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const data: any = {
      title: formData.title,
      category: formData.category as any,
      whatYouDid: formData.whatYouDid,
    }

    if (formData.audienceName) data.audienceName = formData.audienceName
    if (formData.audienceSize) data.audienceSize = parseInt(formData.audienceSize)
    if (formData.objectiveId) data.objectiveId = formData.objectiveId
    if (formData.frequency) data.frequency = formData.frequency
    if (formData.volume) data.volume = parseInt(formData.volume)
    if (formData.commsOutputId) data.commsOutputId = formData.commsOutputId
    if (formData.processSteps) {
      try {
        const steps = JSON.parse(formData.processSteps)
        if (Array.isArray(steps)) {
          data.processSteps = steps
        } else {
          data.processSteps = formData.processSteps.split(',').map(s => s.trim())
        }
      } catch {
        data.processSteps = formData.processSteps.split(',').map(s => s.trim())
      }
    }
    if (formData.impact) data.impact = formData.impact

    const result = await updateAchievement(achievementId, data)
    setSaving(false)

    if (result.success) {
      router.push('/achievements')
    } else {
      alert('Failed to update achievement: ' + JSON.stringify(result.error))
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/achievements" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Achievements
        </Link>
        <h2 className="text-3xl font-bold text-gray-900">Edit Achievement</h2>
        <p className="text-gray-600 mt-2">Update achievement details</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {categoryLabels[cat]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="whatYouDid" className="block text-sm font-medium text-gray-700 mb-2">
            What You Did *
          </label>
          <textarea
            id="whatYouDid"
            required
            rows={4}
            value={formData.whatYouDid}
            onChange={(e) => setFormData({ ...formData, whatYouDid: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="audienceName" className="block text-sm font-medium text-gray-700 mb-2">
              Audience Name
            </label>
            <input
              type="text"
              id="audienceName"
              value={formData.audienceName}
              onChange={(e) => setFormData({ ...formData, audienceName: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="audienceSize" className="block text-sm font-medium text-gray-700 mb-2">
              Audience Size
            </label>
            <input
              type="number"
              id="audienceSize"
              min="1"
              value={formData.audienceSize}
              onChange={(e) => setFormData({ ...formData, audienceSize: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <input
              type="text"
              id="frequency"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-2">
              Volume
            </label>
            <input
              type="number"
              id="volume"
              min="1"
              value={formData.volume}
              onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="objectiveId" className="block text-sm font-medium text-gray-700 mb-2">
            Linked Objective
          </label>
          <select
            id="objectiveId"
            value={formData.objectiveId}
            onChange={(e) => setFormData({ ...formData, objectiveId: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">None</option>
            {objectives.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="commsOutputId" className="block text-sm font-medium text-gray-700 mb-2">
              Comms Output
            </label>
            <select
              id="commsOutputId"
              value={formData.commsOutputId}
              onChange={(e) => setFormData({ ...formData, commsOutputId: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">None</option>
              {commsOutputs.map((comms) => (
                <option key={comms.id} value={comms.id}>
                  {comms.title}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div>
          <label htmlFor="processSteps" className="block text-sm font-medium text-gray-700 mb-2">
            Process Steps (JSON array or comma-separated)
          </label>
          <textarea
            id="processSteps"
            rows={3}
            value={formData.processSteps}
            onChange={(e) => setFormData({ ...formData, processSteps: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="impact" className="block text-sm font-medium text-gray-700 mb-2">
            Impact
          </label>
          <textarea
            id="impact"
            rows={3}
            value={formData.impact}
            onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/achievements"
            className="flex-1 rounded-lg bg-gray-200 text-gray-700 px-6 py-3 font-semibold hover:bg-gray-300 transition text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
