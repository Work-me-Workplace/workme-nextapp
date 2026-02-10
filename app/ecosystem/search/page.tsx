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
      
      // Check if it's a handle (starts with @ or looks like a handle)
      const query = searchQuery.trim()
      const isHandle = query.startsWith('@') || /^[a-zA-Z0-9_]+$/.test(query)
      
      if (isHandle) {
        // Manual handle entry - create person directly
        const handle = query.replace('@', '').trim()
        const mockResult: XUserSearchResult = {
          fullName: handle, // Will be updated when we resolve
          handle: handle,
          xUserId: '', // Will be resolved
          profileImage: '',
          bio: '',
          followers: 0,
        }
        setResults([mockResult])
      } else {
        // Try database search (doesn't use X API)
        const response = await api.get(`/api/ecosystem/search?q=${encodeURIComponent(query)}`)
        
        if (response.data.success) {
          // Transform EcosystemPerson[] to XUserSearchResult[]
          const persons = response.data.persons || []
          const transformedResults: XUserSearchResult[] = persons.map((p: any) => ({
            fullName: p.fullName,
            handle: p.xHandle || '',
            xUserId: p.xUserId || '',
            profileImage: p.profileImage || '',
            bio: p.bio || '',
            followers: p.followers || 0,
          }))
          setResults(transformedResults)
        } else {
          alert('Search failed: ' + (response.data.error || 'Unknown error'))
          setResults([])
        }
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
      setSaving(result.handle || result.xUserId)
      
      // Step 1: Save person (with handle)
      const saveResponse = await api.post('/api/ecosystem/savePerson', {
        fullName: result.fullName || result.handle,
        xHandle: result.handle,
        xUserId: result.xUserId || undefined,
        profileImage: result.profileImage || undefined,
        bio: result.bio || undefined,
        followers: result.followers || undefined,
      })

      if (!saveResponse.data.success) {
        throw new Error(saveResponse.data.error || 'Failed to save person')
      }

      const { personId } = saveResponse.data

      // Step 2: Resolve xUserId if we have handle but no xUserId
      if (result.handle && !result.xUserId) {
        try {
          const resolveResponse = await api.post('/api/x/resolve-user-id', {
            personId,
            handle: result.handle,
          })
          
          if (resolveResponse.data.success && resolveResponse.data.xUserId) {
            // Update result with resolved xUserId for hydration
            result.xUserId = resolveResponse.data.xUserId
          }
        } catch (resolveError) {
          console.error('xUserId resolution error (non-fatal):', resolveError)
          // Continue even if resolution fails
        }
      }

      // Step 3: Hydrate profile data (if we have xUserId)
      if (result.xUserId || result.handle) {
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

      // Step 4: Enable feed follow (optional - user can do this later)
      // For now, just save the contact

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
                    placeholder="Search by name or enter X handle (e.g., @dfriedmanWFED or dfriedmanWFED)"
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
                
                {results.map((result, idx) => (
                  <div
                    key={result.xUserId || result.handle || idx}
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
                        disabled={saving === (result.xUserId || result.handle)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
                      >
                        {saving === (result.xUserId || result.handle) ? (
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

