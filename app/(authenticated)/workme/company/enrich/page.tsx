'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface EnrichedCompany {
  id: string
  name: string
  missionStatement?: string | null
  vision?: string | null
  values?: string | null
  headcount?: number | null
  industry?: string | null
  website?: string | null
  linkedinUrl?: string | null
  twitterUrl?: string | null
  facebookUrl?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  ceoName?: string | null
  ceoTitle?: string | null
  deputyName?: string | null
  deputyTitle?: string | null
  chiefOfStaff?: string | null
  directorates?: string[]
  brandLogoUrl?: string | null
  brandColorPrimary?: string | null
  brandColorSecondary?: string | null
}

export default function CompanyEnrichmentPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [enrichedCompany, setEnrichedCompany] = useState<EnrichedCompany | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEnrich = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name')
      return
    }

    setLoading(true)
    setError(null)
    setEnrichedCompany(null)

    try {
      const response = await api.post('/api/enrich/company', {
        companyName: companyName.trim(),
      })

      if (response.data.success && response.data.company) {
        setEnrichedCompany(response.data.company)
      } else {
        setError(response.data.error || 'Failed to enrich company')
      }
    } catch (err: any) {
      console.error('Enrichment error:', err)
      setError(err.response?.data?.error || err.message || 'Failed to enrich company')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!enrichedCompany) return

    // Company is already saved via upsert in the API
    // Just redirect or show success
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Company Enrichment
          </h1>

          {/* Input Form */}
          <div className="mb-6">
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <div className="flex gap-4">
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEnrich()}
                placeholder="e.g., Naval Sea Systems Command, NASA, Google"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              <button
                onClick={handleEnrich}
                disabled={loading || !companyName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enriching...' : 'Enrich'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Preview */}
          {enrichedCompany && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Enriched Company Data
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Basic Information</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-700">Name</dt>
                      <dd className="text-sm text-gray-900">{enrichedCompany.name}</dd>
                    </div>
                    {enrichedCompany.industry && (
                      <div>
                        <dt className="text-sm font-medium text-gray-700">Industry</dt>
                        <dd className="text-sm text-gray-900">{enrichedCompany.industry}</dd>
                      </div>
                    )}
                    {enrichedCompany.headcount && (
                      <div>
                        <dt className="text-sm font-medium text-gray-700">Headcount</dt>
                        <dd className="text-sm text-gray-900">{enrichedCompany.headcount.toLocaleString()}</dd>
                      </div>
                    )}
                    {enrichedCompany.website && (
                      <div>
                        <dt className="text-sm font-medium text-gray-700">Website</dt>
                        <dd className="text-sm text-gray-900">
                          <a href={enrichedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {enrichedCompany.website}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Location</h3>
                  <dl className="space-y-2">
                    {enrichedCompany.city && (
                      <div>
                        <dt className="text-sm font-medium text-gray-700">City</dt>
                        <dd className="text-sm text-gray-900">{enrichedCompany.city}</dd>
                      </div>
                    )}
                    {enrichedCompany.state && (
                      <div>
                        <dt className="text-sm font-medium text-gray-700">State</dt>
                        <dd className="text-sm text-gray-900">{enrichedCompany.state}</dd>
                      </div>
                    )}
                    {enrichedCompany.country && (
                      <div>
                        <dt className="text-sm font-medium text-gray-700">Country</dt>
                        <dd className="text-sm text-gray-900">{enrichedCompany.country}</dd>
                      </div>
                    )}
                    {enrichedCompany.phone && (
                      <div>
                        <dt className="text-sm font-medium text-gray-700">Phone</dt>
                        <dd className="text-sm text-gray-900">{enrichedCompany.phone}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Leadership */}
                {(enrichedCompany.ceoName || enrichedCompany.deputyName || enrichedCompany.chiefOfStaff) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Leadership</h3>
                    <dl className="space-y-2">
                      {enrichedCompany.ceoName && (
                        <div>
                          <dt className="text-sm font-medium text-gray-700">CEO/Commander</dt>
                          <dd className="text-sm text-gray-900">
                            {enrichedCompany.ceoName}
                            {enrichedCompany.ceoTitle && ` - ${enrichedCompany.ceoTitle}`}
                          </dd>
                        </div>
                      )}
                      {enrichedCompany.deputyName && (
                        <div>
                          <dt className="text-sm font-medium text-gray-700">Deputy/COO</dt>
                          <dd className="text-sm text-gray-900">
                            {enrichedCompany.deputyName}
                            {enrichedCompany.deputyTitle && ` - ${enrichedCompany.deputyTitle}`}
                          </dd>
                        </div>
                      )}
                      {enrichedCompany.chiefOfStaff && (
                        <div>
                          <dt className="text-sm font-medium text-gray-700">Chief of Staff</dt>
                          <dd className="text-sm text-gray-900">{enrichedCompany.chiefOfStaff}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* Identity */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Identity</h3>
                  <dl className="space-y-2">
                    {enrichedCompany.missionStatement && (
                      <div>
                        <dt className="text-sm font-medium text-gray-700">Mission</dt>
                        <dd className="text-sm text-gray-900">{enrichedCompany.missionStatement}</dd>
                      </div>
                    )}
                    {enrichedCompany.vision && (
                      <div>
                        <dt className="text-sm font-medium text-gray-700">Vision</dt>
                        <dd className="text-sm text-gray-900">{enrichedCompany.vision}</dd>
                      </div>
                    )}
                    {enrichedCompany.values && (
                      <div>
                        <dt className="text-sm font-medium text-gray-700">Values</dt>
                        <dd className="text-sm text-gray-900">{enrichedCompany.values}</dd>
                      </div>
                    )}
                    {enrichedCompany.directorates && enrichedCompany.directorates.length > 0 && (
                      <div>
                        <dt className="text-sm font-medium text-gray-700">Directorates</dt>
                        <dd className="text-sm text-gray-900">{enrichedCompany.directorates.join(', ')}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Social Links */}
                {(enrichedCompany.linkedinUrl || enrichedCompany.twitterUrl || enrichedCompany.facebookUrl) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Social Links</h3>
                    <dl className="space-y-2">
                      {enrichedCompany.linkedinUrl && (
                        <div>
                          <dt className="text-sm font-medium text-gray-700">LinkedIn</dt>
                          <dd className="text-sm text-gray-900">
                            <a href={enrichedCompany.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {enrichedCompany.linkedinUrl}
                            </a>
                          </dd>
                        </div>
                      )}
                      {enrichedCompany.twitterUrl && (
                        <div>
                          <dt className="text-sm font-medium text-gray-700">Twitter</dt>
                          <dd className="text-sm text-gray-900">
                            <a href={enrichedCompany.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {enrichedCompany.twitterUrl}
                            </a>
                          </dd>
                        </div>
                      )}
                      {enrichedCompany.facebookUrl && (
                        <div>
                          <dt className="text-sm font-medium text-gray-700">Facebook</dt>
                          <dd className="text-sm text-gray-900">
                            <a href={enrichedCompany.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {enrichedCompany.facebookUrl}
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Apply / Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

