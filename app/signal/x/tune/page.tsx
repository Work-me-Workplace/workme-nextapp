'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Twitter, Settings, X } from 'lucide-react'

const ORGS = ['SECNAV', 'NAVSEA', 'DOD', 'CNO', 'DefenseNews']
const PEOPLE = ['Carlos Del Toro', 'Erik Raven', 'ADM Smith']
const HASHTAGS = ['#navy', '#industrialbase', '#shipbuilding', '#ffgx', '#dod']

export default function TuneXFeedPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([])
  const [peopleSearch, setPeopleSearch] = useState('')
  const [hashtagSearch, setHashtagSearch] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
      }
    }
  }, [router])

  const handleOrgToggle = (org: string) => {
    setSelectedOrgs((prev) =>
      prev.includes(org) ? prev.filter((o) => o !== org) : [...prev, org]
    )
  }

  const handleAddPerson = (person: string) => {
    if (person.trim() && !selectedPeople.includes(person.trim())) {
      setSelectedPeople((prev) => [...prev, person.trim()])
      setPeopleSearch('')
    }
  }

  const handleRemovePerson = (person: string) => {
    setSelectedPeople((prev) => prev.filter((p) => p !== person))
  }

  const handleAddHashtag = (hashtag: string) => {
    const normalized = hashtag.trim().startsWith('#') ? hashtag.trim() : `#${hashtag.trim()}`
    if (normalized && !selectedHashtags.includes(normalized)) {
      setSelectedHashtags((prev) => [...prev, normalized])
      setHashtagSearch('')
    }
  }

  const handleRemoveHashtag = (hashtag: string) => {
    setSelectedHashtags((prev) => prev.filter((h) => h !== hashtag))
  }

  const handlePersonSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (peopleSearch.trim()) {
        handleAddPerson(peopleSearch)
      }
    }
  }

  const handleHashtagSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (hashtagSearch.trim()) {
        handleAddHashtag(hashtagSearch)
      }
    }
  }

  if (!workMeId) {
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.clear()
                  router.push('/signin')
                }}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
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
                <Settings className="h-8 w-8 text-purple-600" />
                <h1 className="text-3xl font-bold text-gray-900">Tune X Feed</h1>
              </div>
              <p className="text-gray-600">Select organizations, people, and hashtags to follow.</p>
            </div>

            {/* Organizations Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Organizations</h2>
              <div className="space-y-2">
                {ORGS.map((org) => (
                  <label
                    key={org}
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOrgs.includes(org)}
                      onChange={() => handleOrgToggle(org)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-gray-900 font-medium">{org}</span>
                  </label>
                ))}
              </div>
              {selectedOrgs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    Selected: <span className="font-medium text-purple-600">{selectedOrgs.length}</span> organization{selectedOrgs.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* People Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">People</h2>
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                    onKeyPress={handlePersonSearchKeyPress}
                    placeholder="Search or add person (e.g., @username or name)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    onClick={() => handleAddPerson(peopleSearch)}
                    disabled={!peopleSearch.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                {PEOPLE.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">Suggestions: {PEOPLE.join(', ')}</p>
                )}
              </div>
              {selectedPeople.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedPeople.map((person) => (
                    <span
                      key={person}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                    >
                      {person}
                      <button
                        onClick={() => handleRemovePerson(person)}
                        className="hover:text-purple-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No people selected</p>
              )}
            </div>

            {/* Hashtags Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hashtags</h2>
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hashtagSearch}
                    onChange={(e) => setHashtagSearch(e.target.value)}
                    onKeyPress={handleHashtagSearchKeyPress}
                    placeholder="Search or add hashtag (e.g., #navy or navy)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    onClick={() => handleAddHashtag(hashtagSearch)}
                    disabled={!hashtagSearch.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                {HASHTAGS.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">Suggestions: {HASHTAGS.join(', ')}</p>
                )}
              </div>
              {selectedHashtags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedHashtags.map((hashtag) => (
                    <span
                      key={hashtag}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                    >
                      {hashtag}
                      <button
                        onClick={() => handleRemoveHashtag(hashtag)}
                        className="hover:text-purple-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No hashtags selected</p>
              )}
            </div>

            {/* Summary */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-900">
                <span className="font-semibold">Summary:</span> Following{' '}
                <span className="font-medium">{selectedOrgs.length}</span> organization{selectedOrgs.length !== 1 ? 's' : ''},{' '}
                <span className="font-medium">{selectedPeople.length}</span> person{selectedPeople.length !== 1 ? 's' : ''}, and{' '}
                <span className="font-medium">{selectedHashtags.length}</span> hashtag{selectedHashtags.length !== 1 ? 's' : ''}.
              </p>
              <p className="text-xs text-purple-700 mt-2">
                Note: Selections are stored locally. Backend save functionality coming soon.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

