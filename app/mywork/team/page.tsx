'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Plus, Users, UserCheck, UserCog, UserMinus } from 'lucide-react'

type TeamMember = {
  id: string
  firstName: string
  lastName: string
  type: 'Director' | 'Deputy' | 'Peer' | 'Subordinate'
  [key: string]: any
}

export default function TeamMembersPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [directors, setDirectors] = useState<TeamMember[]>([])
  const [deputies, setDeputies] = useState<TeamMember[]>([])
  const [peers, setPeers] = useState<TeamMember[]>([])
  const [subordinates, setSubordinates] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [description, setDescription] = useState('')
  const [selectedType, setSelectedType] = useState<'Director' | 'Deputy' | 'Peer' | 'Subordinate' | null>(null)
  const [inferring, setInferring] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      setWorkMeId(id)
      loadTeamMembers()
    }
  }, [router])

  async function loadTeamMembers() {
    try {
      setLoading(true)
      const response = await api.get('/api/team')
      if (response.data.success) {
        setDirectors(response.data.data.directors || [])
        setDeputies(response.data.data.deputies || [])
        setPeers(response.data.data.peers || [])
        setSubordinates(response.data.data.subordinates || [])
      }
    } catch (error) {
      console.error('Failed to load team members:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleInferAndAdd() {
    if (!description.trim() || !selectedType) return

    try {
      setInferring(true)
      // First infer the data
      const inferResponse = await api.post('/api/team/infer', {
        description,
        type: selectedType,
      })

      if (!inferResponse.data.success) {
        alert('Failed to infer team member data')
        return
      }

      const inferredData = inferResponse.data.data

      // Then create the team member
      const createResponse = await api.post('/api/team', {
        type: selectedType,
        data: inferredData,
      })

      if (createResponse.data.success) {
        // Reload team members
        await loadTeamMembers()
        // Reset form
        setDescription('')
        setSelectedType(null)
        setShowAddModal(false)
      } else {
        alert('Failed to create team member')
      }
    } catch (error: any) {
      console.error('Failed to add team member:', error)
      alert(error.response?.data?.error || 'Failed to add team member')
    } finally {
      setInferring(false)
    }
  }

  function TeamMemberCard({ member }: { member: TeamMember }) {
    const getIcon = () => {
      switch (member.type) {
        case 'Director':
          return UserCheck
        case 'Deputy':
          return UserCog
        case 'Peer':
          return Users
        case 'Subordinate':
          return UserMinus
        default:
          return Users
      }
    }

    const getColor = () => {
      switch (member.type) {
        case 'Director':
          return 'blue'
        case 'Deputy':
          return 'purple'
        case 'Peer':
          return 'green'
        case 'Subordinate':
          return 'orange'
        default:
          return 'gray'
      }
    }

    const Icon = getIcon()
    const color = getColor()
    const colorClasses = {
      blue: 'border-blue-500 bg-blue-50',
      purple: 'border-purple-500 bg-purple-50',
      green: 'border-green-500 bg-green-50',
      orange: 'border-orange-500 bg-orange-50',
      gray: 'border-gray-500 bg-gray-50',
    }
    const iconColorClasses = {
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      green: 'text-green-600',
      orange: 'text-orange-600',
      gray: 'text-gray-600',
    }

    return (
      <div
        className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${colorClasses[color as keyof typeof colorClasses]}`}
      >
        <div className="flex items-start">
          <div className="p-2 rounded-lg bg-white">
            <Icon className={`h-5 w-5 ${iconColorClasses[color as keyof typeof iconColorClasses]}`} />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {member.firstName} {member.lastName}
            </h3>
            <p className="text-sm text-gray-600 capitalize">{member.type}</p>
            {member.internalRank && (
              <p className="text-xs text-gray-500 mt-1">{member.internalRank}</p>
            )}
            {member.miscNotes && (
              <p className="text-xs text-gray-600 mt-2 line-clamp-2">{member.miscNotes}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Group deputies by director (if they have a director relationship)
  // For now, just show all directors first, then their deputies, then peers, then subordinates

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/mywork" className="flex items-center space-x-2">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
                  <p className="text-gray-600 mt-2">Your workplace relationship graph</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Team Member
                </button>
              </div>
            </div>

            {/* Directors Section */}
            {directors.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Directors</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {directors.map((director) => (
                    <TeamMemberCard key={director.id} member={director} />
                  ))}
                </div>
              </div>
            )}

            {/* Deputies Section */}
            {deputies.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Deputies</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deputies.map((deputy) => (
                    <TeamMemberCard key={deputy.id} member={deputy} />
                  ))}
                </div>
              </div>
            )}

            {/* Peers Section */}
            {peers.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Peers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {peers.map((peer) => (
                    <TeamMemberCard key={peer.id} member={peer} />
                  ))}
                </div>
              </div>
            )}

            {/* Subordinates Section */}
            {subordinates.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Subordinates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subordinates.map((subordinate) => (
                    <TeamMemberCard key={subordinate.id} member={subordinate} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {directors.length === 0 && deputies.length === 0 && peers.length === 0 && subordinates.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                <p className="text-gray-600 mb-4">Start building your workplace relationship graph</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Team Member
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Team Member</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What type of team member?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Director', 'Deputy', 'Peer', 'Subordinate'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        selectedType === type
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe this person
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., 'John Smith is my director. He's been in the role for 3 years, manages a team of 15, and is generally friendly but can be strict about deadlines. He hired me 2 years ago. I trust him at about a 7/10.'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Just describe the person naturally - AI will extract all the details
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setDescription('')
                    setSelectedType(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInferAndAdd}
                  disabled={!description.trim() || !selectedType || inferring}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inferring ? 'Inferring...' : 'Add Team Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
