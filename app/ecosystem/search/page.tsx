'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import TopNav from '@/components/layout/TopNav'
import { Search, UserPlus, Loader2, Twitter } from 'lucide-react'
import api from '@/lib/api'

interface XUserSearchResult {
  fullName: string
  handle: string
  xUserId: string
  profileImage: string
  bio: string
  followers: number
}

export default function EcosystemSearchPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<XUserSearchResult[]>([])
  const [saving, setSaving] = useState<string | null>(null) // personId being saved

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      setWorkMeId(id)
    }
  }, [router])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    try {
      setSearching(true)
      const response = await api.get(`/api/x/search?q=${encodeURIComponent(searchQuery.trim())}`)
      
      if (response.data.success) {
        setResults(response.data.results || [])
      } else {
        alert('Search failed: ' + (response.data.error || 'Unknown error'))
        setResults([])
      }
    } catch (error: any) {
      console.error('Search error:', error)
      alert('Search failed: ' + (error.response?.data?.error || error.message))
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSaveContact = async (result: XUserSearchResult) => {
    if (!workMeId) return

    try {
      setSaving(result.xUserId)
      
      // Save person
      const saveResponse = await api.post('/api/ecosystem/savePerson', {
        fullName: result.fullName,
        xHandle: result.handle,
        xUserId: result.xUserId,
        profileImage: result.profileImage,
        bio: result.bio,
        followers: result.followers,
      })

      if (!saveResponse.data.success) {
        throw new Error(saveResponse.data.error || 'Failed to save person')
      }

      const { personId, needsHydration } = saveResponse.data

      // Trigger hydration immediately
      if (needsHydration) {
        try {
          await api.post('/api/x/hydrate', {
            personId,
            handle: result.handle,
            xUserId: result.xUserId,
          })
        } catch (hydrateError) {
          console.error('Hydration error (non-fatal):', hydrateError)
          // Continue even if hydration fails
        }
      }

      // Navigate to contact detail page
      router.push(`/ecosystem/${personId}`)
    } catch (error: any) {
      console.error('Save error:', error)
      alert('Failed to save contact: ' + (error.response?.data?.error || error.message))
      setSaving(null)
    }
  }

  if (!workMeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <div className="flex">
        <SidebarNav />
        
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Find People in Defense Ecosystem</h1>
              <p className="text-gray-600 mt-2">
                Search for journalists, influencers, think-tank analysts, and defense industry experts
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find journalist, influencer, think-tank analyst… (e.g., Justin Katz)"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={searching}
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {searching ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Search
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Search Results */}
            {results.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Results ({results.length})
                </h2>
                
                {results.map((result) => (
                  <div
                    key={result.xUserId}
                    className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition"
                  >
                    <div className="flex items-start gap-4">
                      {/* Profile Image */}
                      {result.profileImage && (
                        <img
                          src={result.profileImage}
                          alt={result.fullName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      )}
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {result.fullName}
                          </h3>
                          {result.handle && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Twitter className="h-4 w-4" />
                              <span className="text-sm">@{result.handle}</span>
                            </div>
                          )}
                        </div>
                        
                        {result.bio && (
                          <p className="text-sm text-gray-600 mb-3">{result.bio}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{result.followers.toLocaleString()} followers</span>
                        </div>
                      </div>
                      
                      {/* Save Button */}
                      <button
                        onClick={() => handleSaveContact(result)}
                        disabled={saving === result.xUserId}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
                      >
                        {saving === result.xUserId ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Add to My Ecosystem
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searching === false && results.length === 0 && searchQuery && (
              <div className="text-center py-12 text-gray-500">
                No results found. Try a different search term.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

