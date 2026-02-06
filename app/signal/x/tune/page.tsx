'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import api from '@/lib/api'
import { Twitter, Plus, XCircle, User, Building2, Hash, Search } from 'lucide-react'

interface EcosystemContact {
  id: string
  personId: string
  person: {
    id: string
    fullName: string
    xHandle: string | null
    title: string | null
    domain: string | null
    beat: string | null
    companyName: string | null
    profileImage: string | null
    affinityToMyOrg: string | null
  }
  stance: string | null
  relationshipType: string | null
  followForXFeed: boolean
  notes: string | null
  tags: string[]
  priority: number | null
}

export default function TuneXFeedPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState<EcosystemContact[]>([])
  const [adding, setAdding] = useState(false)
  const [searching, setSearching] = useState(false)
  
  // Add form state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null)
  const [stance, setStance] = useState<string>('unknown')
  const [relationshipType, setRelationshipType] = useState<string>('media')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadContacts(id)
      }
    }
  }, [router])

  const loadContacts = async (id: string) => {
    try {
      setLoading(true)
      const response = await api.get('/api/ecosystem/my-contacts?followForXFeed=true')
      if (response.data.success) {
        setContacts(response.data.contacts || [])
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query')
      return
    }

    try {
      setSearching(true)
      const response = await api.get(`/api/ecosystem/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.data.success) {
        setSearchResults(response.data.persons || [])
      }
    } catch (error: any) {
      console.error('Error searching:', error)
      alert(error.response?.data?.error || 'Failed to search')
    } finally {
      setSearching(false)
    }
  }

  const handleAddContact = async () => {
    if (!selectedPerson) {
      alert('Please select a person from search results')
      return
    }

    try {
      setAdding(true)
      const response = await api.post('/api/ecosystem/contacts', {
        personId: selectedPerson.id,
        stance,
        relationshipType,
        followForXFeed: true,
      })

      if (response.data.success) {
        setSearchQuery('')
        setSearchResults([])
        setSelectedPerson(null)
        setStance('unknown')
        setRelationshipType('media')
        await loadContacts(workMeId!)
      } else {
        alert('Failed to add: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Error adding contact:', error)
      alert(error.response?.data?.error || 'Failed to add contact')
    } finally {
      setAdding(false)
    }
  }

  const handleToggleFollow = async (contactId: string, currentValue: boolean) => {
    try {
      const response = await api.patch(`/api/ecosystem/contacts/${contactId}`, {
        followForXFeed: !currentValue,
      })

      if (response.data.success) {
        await loadContacts(workMeId!)
      } else {
        alert('Failed to update: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error)
      alert(error.response?.data?.error || 'Failed to update')
    }
  }

  const handleRemove = async (contactId: string) => {
    if (!confirm('Remove this contact from X feed?')) return

    try {
      const response = await api.patch(`/api/ecosystem/contacts/${contactId}`, {
        followForXFeed: false,
      })

      if (response.data.success) {
        await loadContacts(workMeId!)
      } else {
        alert('Failed to remove: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Error removing contact:', error)
      alert(error.response?.data?.error || 'Failed to remove contact')
    }
  }

  const getStanceColor = (stance: string | null) => {
    switch (stance) {
      case 'favorable':
        return 'bg-green-100 text-green-800'
      case 'unfavorable':
        return 'bg-red-100 text-red-800'
      case 'neutral':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <Link href="/signal/x" className="text-purple-600 hover:text-purple-800 text-sm mb-4 inline-block">
                ← Back to X Feed
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <Twitter className="h-8 w-8 text-purple-600" />
                <h1 className="text-3xl font-bold text-gray-900">Step 1: Who to Follow</h1>
              </div>
              <p className="text-gray-600">Manage X handles, organizations, and hashtags to follow for your feed.</p>
            </div>

            {/* Search & Add Contact */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Contact to Follow</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search for Person</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search by name, X handle, or title (e.g., Justin Katz, @navalnews)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={searching || !searchQuery.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {searching ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <Search className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <p className="text-sm font-medium text-gray-700 mb-2">Select a person:</p>
                    <div className="space-y-2">
                      {searchResults.map((person) => (
                        <button
                          key={person.id}
                          onClick={() => setSelectedPerson(person)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition ${
                            selectedPerson?.id === person.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{person.fullName}</p>
                              {person.title && <p className="text-sm text-gray-600">{person.title}</p>}
                              {person.xHandle && (
                                <p className="text-sm text-purple-600">@{person.xHandle}</p>
                              )}
                            </div>
                            {selectedPerson?.id === person.id && (
                              <div className="text-purple-600">✓</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relationship Settings */}
                {selectedPerson && (
                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stance</label>
                      <select
                        value={stance}
                        onChange={(e) => setStance(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="unknown">Unknown</option>
                        <option value="favorable">Favorable</option>
                        <option value="neutral">Neutral</option>
                        <option value="unfavorable">Unfavorable</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relationship Type</label>
                      <select
                        value={relationshipType}
                        onChange={(e) => setRelationshipType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="media">Media</option>
                        <option value="influencer">Influencer</option>
                        <option value="analyst">Analyst</option>
                        <option value="competitor">Competitor</option>
                        <option value="partner">Partner</option>
                        <option value="regulator">Regulator</option>
                        <option value="customer">Customer</option>
                        <option value="vendor">Vendor</option>
                      </select>
                    </div>

                    <button
                      onClick={handleAddContact}
                      disabled={adding}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {adding ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5" />
                          Add to X Feed
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Contacts List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Following for X Feed ({contacts.length})
                </h2>
              </div>

              {contacts.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No contacts following yet. Search and add contacts above to get started!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex items-center gap-4 flex-1">
                        {contact.person.profileImage ? (
                          <img
                            src={contact.person.profileImage}
                            alt={contact.person.fullName}
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-purple-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900">{contact.person.fullName}</h3>
                            {contact.stance && (
                              <span className={`text-xs px-2 py-0.5 rounded ${getStanceColor(contact.stance)}`}>
                                {contact.stance}
                              </span>
                            )}
                            {contact.relationshipType && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded capitalize">
                                {contact.relationshipType}
                              </span>
                            )}
                          </div>
                          {contact.person.title && (
                            <p className="text-sm text-gray-600">{contact.person.title}</p>
                          )}
                          {contact.person.xHandle && (
                            <p className="text-sm text-purple-600">@{contact.person.xHandle}</p>
                          )}
                          {contact.person.companyName && (
                            <p className="text-xs text-gray-500">{contact.person.companyName}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(contact.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove from X Feed"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next Step */}
            {contacts.length > 0 && (
              <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-900 mb-1">Ready for Step 2?</h3>
                    <p className="text-purple-700">View your feed with signals from the accounts you follow.</p>
                  </div>
                  <Link
                    href="/signal/x/feed"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                  >
                    View Feed →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
