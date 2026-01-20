'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function WorkforceStuffIngestPage() {
  const router = useRouter()
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsedData, setParsedData] = useState<any>(null)
  const [selectedType, setSelectedType] = useState<string>('')
  const [step, setStep] = useState<'input' | 'review'>('input')

  async function handleParse() {
    if (!rawText.trim()) {
      alert('Please paste some text first')
      return
    }

    if (!selectedType) {
      alert('Please select a content type first')
      return
    }

    setLoading(true)
    try {
      const { default: api } = await import('@/lib/api')
      const response = await api.post('/api/workforcestuff/parse', {
        rawText,
        type: selectedType,
      })

      if (response.data.success) {
        setParsedData(response.data.parsedData)
        setStep('review')
      } else {
        alert('Failed to parse: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Parse error:', error)
      alert('Failed to parse content')
    } finally {
      setLoading(false)
    }
  }

  async function handleReparse(typeToUse?: string) {
    // User changed type, reparse with new type
    const type = typeToUse || selectedType
    if (!type || !rawText.trim()) return
    
    setLoading(true)
    try {
      const { default: api } = await import('@/lib/api')
      const response = await api.post('/api/workforcestuff/parse', {
        rawText,
        type: type,
      })

      if (response.data.success) {
        setParsedData(response.data.parsedData)
      } else {
        alert('Failed to reparse: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Reparse error:', error)
      alert('Failed to reparse content')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!selectedType || !parsedData) return

    setLoading(true)
    try {
      const { default: api } = await import('@/lib/api')
      const response = await api.post('/api/workforcestuff/save', {
        type: selectedType,
        data: parsedData,
        rawText,
      })

      if (response.data.success) {
        router.push(response.data.redirectTo)
      } else {
        alert('Failed to save: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Workforce Stuff
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Ingest Workforce Content</h1>
          <p className="text-gray-600 mt-2">
            {step === 'input' ? 'Select the content type and paste your content to parse it' : 'Review and edit the parsed fields'}
          </p>
        </div>

        {step === 'input' && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-6"
              >
                <option value="">Select a type...</option>
                <option value="training">Training</option>
                <option value="career">Career Opportunity</option>
                <option value="event">Event</option>
                <option value="campaign">Campaign</option>
                <option value="impact_event">Impact Event</option>
                <option value="community">Community Engagement</option>
                <option value="benefits">Benefits</option>
                <option value="employee_cause">Employee Cause</option>
                <option value="leader_engagement">Leader Engagement</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Content
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your workforce communication content here..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>

            <button
              onClick={handleParse}
              disabled={!rawText.trim() || !selectedType || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  Parse Content
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        )}

        {step === 'review' && parsedData && (
          <div className="space-y-6">
            {/* Step 1: Type Review */}
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Step 1: Confirm Type</h2>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => {
                  const newType = e.target.value
                  setSelectedType(newType)
                  // Trigger reparse if type changes and we have content
                  if (newType && rawText.trim()) {
                    handleReparse(newType)
                  }
                }}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="training">Training</option>
                <option value="career">Career Opportunity</option>
                <option value="event">Event</option>
                <option value="campaign">Campaign</option>
                <option value="impact_event">Impact Event</option>
                <option value="community">Community Engagement</option>
                <option value="benefits">Benefits</option>
                <option value="employee_cause">Employee Cause</option>
                <option value="leader_engagement">Leader Engagement</option>
              </select>
            </div>

            {/* Step 2: Parsed Fields Review */}
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Step 2: Review Parsed Fields</h2>
              
              {selectedType === 'impact_event' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={parsedData.title || ''}
                      onChange={(e) => setParsedData({...parsedData, title: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={parsedData.description || ''}
                      onChange={(e) => setParsedData({...parsedData, description: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md h-32"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
                    <input
                      type="date"
                      value={parsedData.effectiveDate || ''}
                      onChange={(e) => setParsedData({...parsedData, effectiveDate: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Impacted Population</label>
                    <input
                      type="text"
                      value={parsedData.impactedPopulation || ''}
                      onChange={(e) => setParsedData({...parsedData, impactedPopulation: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                    <select
                      value={parsedData.urgency || 'Medium'}
                      onChange={(e) => setParsedData({...parsedData, urgency: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">POC First Name</label>
                      <input
                        type="text"
                        value={parsedData.pocFirstName || ''}
                        onChange={(e) => setParsedData({...parsedData, pocFirstName: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">POC Last Name</label>
                      <input
                        type="text"
                        value={parsedData.pocLastName || ''}
                        onChange={(e) => setParsedData({...parsedData, pocLastName: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">POC Email</label>
                      <input
                        type="email"
                        value={parsedData.pocEmail || ''}
                        onChange={(e) => setParsedData({...parsedData, pocEmail: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">POC Phone</label>
                      <input
                        type="tel"
                        value={parsedData.pocPhone || ''}
                        onChange={(e) => setParsedData({...parsedData, pocPhone: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedType !== 'impact_event' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Review UI for {selectedType} coming soon. For now, showing parsed data:
                  </p>
                  <pre className="mt-4 text-xs bg-white p-4 rounded border overflow-auto max-h-96">
                    {JSON.stringify(parsedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Step 3: Save */}
            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('input')}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save to Database
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
