'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import TopNav from '@/components/layout/TopNav'
import { Twitter, RefreshCw, Loader2, Building2, TrendingUp, Users, Calendar, Bell, BellOff } from 'lucide-react'
import api from '@/lib/api'

interface EcosystemPerson {
  id: string
  fullName: string
  xHandle: string | null
  xUserId: string | null
  title: string | null
  seniority: string | null
  domain: string | null
  beat: string | null
  companyName: string | null
  profileImage: string | null
  bio: string | null
  followers: number | null
  topics: string[]
  affinityIndustry: string | null
  affinityToMyOrg: string | null
  latestSignalSummary: string | null
  updatedSummary: string | null
  lastHydratedAt: string | null
  createdAt: string
  updatedAt: string
}

interface Tweet {
  id: string
  text: string
  createdAt: string
  retweetCount: number
  likeCount: number
  replyCount: number
}

export default function ContactDetailPage() {
  const router = useRouter()
  const params = useParams()
  const personId = params.personId as string

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [person, setPerson] = useState<EcosystemPerson | null>(null)
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [followForXFeed, setFollowForXFeed] = useState(false)
  const [updatingFollow, setUpdatingFollow] = useState(false)
  const [contactId, setContactId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      setWorkMeId(id)
      loadPerson()
    }
  }, [personId, router])

  const loadPerson = async () => {
    try {
      setLoading(true)
      
      // Load person data (we'll need a GET endpoint for this)
      // For now, we'll use the personId to fetch from our contact list
      const contactsResponse = await api.get('/api/ecosystem/myContacts')
      const contact = contactsResponse.data.contacts?.find((c: any) => c.personId === personId)
      
      if (contact?.person) {
        setPerson(contact.person)
        setFollowForXFeed(contact.followForXFeed || false)
        setContactId(contact.id)
        
        // If person was hydrated before, load tweets (we could store these separately or reload)
        // For now, we'll trigger a fresh hydration if lastHydratedAt is old (> 1 day)
        const lastHydrated = contact.person.lastHydratedAt 
          ? new Date(contact.person.lastHydratedAt)
          : null
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        
        if (!lastHydrated || lastHydrated < oneDayAgo) {
          // Auto-refresh if data is stale
          handleRefreshSignals(contact.person)
        }
      } else {
        alert('Person not found in your contacts')
        router.push('/ecosystem/search')
      }
    } catch (error: any) {
      console.error('Load error:', error)
      alert('Failed to load person: ' + (error.response?.data?.error || error.message))
      router.push('/ecosystem/search')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshSignals = async (personToRefresh?: EcosystemPerson) => {
    const targetPerson = personToRefresh || person
    if (!targetPerson) return

    try {
      setRefreshing(true)

      // Hydrate (fetch fresh data)
      const hydrateResponse = await api.post('/api/x/hydrate', {
        personId: targetPerson.id,
        handle: targetPerson.xHandle,
        xUserId: targetPerson.xUserId,
      })

      if (hydrateResponse.data.success) {
        const { tweets: newTweets, person: updatedPerson } = hydrateResponse.data
        
        // Analyze tweets
        if (newTweets && newTweets.length > 0) {
          const analyzeResponse = await api.post('/api/x/analyzeTweets', {
            personId: targetPerson.id,
            tweets: newTweets,
          })

          if (analyzeResponse.data.success) {
            setPerson(analyzeResponse.data.person)
            setTweets(newTweets)
          } else {
            setPerson(updatedPerson)
            setTweets(newTweets)
          }
        } else {
          setPerson(updatedPerson)
        }
      }
    } catch (error: any) {
      console.error('Refresh error:', error)
      alert('Failed to refresh signals: ' + (error.response?.data?.error || error.message))
    } finally {
      setRefreshing(false)
    }
  }

  const handleToggleFollowForXFeed = async () => {
    if (!person || !contactId) return

    try {
      setUpdatingFollow(true)
      const newFollowState = !followForXFeed

      const response = await api.patch(`/api/ecosystem/contacts/${contactId}`, {
        followForXFeed: newFollowState,
      })

      if (response.data.success) {
        setFollowForXFeed(newFollowState)
      } else {
        throw new Error(response.data.error || 'Failed to update follow status')
      }
    } catch (error: any) {
      console.error('Toggle follow error:', error)
      alert('Failed to update follow status: ' + (error.response?.data?.error || error.message))
    } finally {
      setUpdatingFollow(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="flex">
          <SidebarNav />
          <main className="flex-1">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center py-12">
                <p className="text-gray-500">Person not found</p>
                <button
                  onClick={() => router.push('/ecosystem/search')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Back to Search
                </button>
              </div>
            </div>
          </main>
        </div>
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
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => router.push('/ecosystem/search')}
                className="text-blue-600 hover:text-blue-700 mb-4"
              >
                ← Back to Search
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{person.fullName}</h1>
            </div>

            {/* Identity Section */}
            <section className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Identity</h2>
              
              <div className="flex items-start gap-6">
                {person.profileImage && (
                  <img
                    src={person.profileImage}
                    alt={person.fullName}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                )}
                
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{person.fullName}</h3>
                      {person.xHandle && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Twitter className="h-4 w-4" />
                          <span className="text-sm">@{person.xHandle}</span>
                        </div>
                      )}
                    </div>
                    {person.title && (
                      <p className="text-gray-600">{person.title}</p>
                    )}
                    {person.companyName && (
                      <div className="flex items-center gap-1 text-gray-600 mt-1">
                        <Building2 className="h-4 w-4" />
                        <span>{person.companyName}</span>
                      </div>
                    )}
                  </div>
                  
                  {person.bio && (
                    <p className="text-sm text-gray-700">{person.bio}</p>
                  )}
                  
                  {person.followers && (
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{person.followers.toLocaleString()} followers</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* X Feed Follow Section */}
            {person.xHandle && (
              <section className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">X Feed</h2>
                    <p className="text-sm text-gray-600">
                      {followForXFeed 
                        ? 'Including this contact in your X feed'
                        : 'Not included in your X feed'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleFollowForXFeed}
                    disabled={updatingFollow}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                      followForXFeed
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                  >
                    {updatingFollow ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : followForXFeed ? (
                      <>
                        <Bell className="h-4 w-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <BellOff className="h-4 w-4" />
                        Follow for Feed
                      </>
                    )}
                  </button>
                </div>
              </section>
            )}

            {/* Signal Intelligence Section */}
            <section className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Signal Intelligence</h2>
                <button
                  onClick={() => handleRefreshSignals()}
                  disabled={refreshing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Refresh Signals
                    </>
                  )}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {person.beat && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Beat</label>
                    <p className="text-gray-900 mt-1">{person.beat}</p>
                  </div>
                )}
                
                {person.affinityIndustry && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Industry Focus</label>
                    <p className="text-gray-900 mt-1">{person.affinityIndustry}</p>
                  </div>
                )}
                
                {person.affinityToMyOrg && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Affinity to My Org</label>
                    <p className="text-gray-900 mt-1 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {person.affinityToMyOrg}
                    </p>
                  </div>
                )}
                
                {person.topics && person.topics.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Topics</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {person.topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {person.latestSignalSummary && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-500">Latest Signal Summary</label>
                  <p className="text-gray-900 mt-1">{person.latestSignalSummary}</p>
                </div>
              )}
              
              {person.lastHydratedAt && (
                <div className="mt-4 text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Last hydrated: {new Date(person.lastHydratedAt).toLocaleString()}</span>
                </div>
              )}
            </section>

            {/* Recent Tweets Section */}
            {tweets.length > 0 && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Tweets</h2>
                
                <div className="space-y-4">
                  {tweets.slice(0, 10).map((tweet) => (
                    <div
                      key={tweet.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <p className="text-gray-900 mb-3">{tweet.text}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{new Date(tweet.createdAt).toLocaleString()}</span>
                        <span>{tweet.likeCount} likes</span>
                        <span>{tweet.retweetCount} retweets</span>
                        <span>{tweet.replyCount} replies</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

