'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth } from 'firebase/auth'
import api from '@/lib/api'

export default function WelcomePage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [companyUnit, setCompanyUnit] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Check Firebase auth - only redirect if not authenticated
  useEffect(() => {
    const firebaseUser = getAuth().currentUser
    if (!firebaseUser) {
      router.replace('/signin')
      return
    }
  }, [router])

  useEffect(() => {
    // Check if user has companyUnit set
    const checkCompanyUnit = async () => {
      if (typeof window === 'undefined') return

      const id = localStorage.getItem('workMeId')
      setWorkMeId(id)

      // Check localStorage first
      const storedCompanyUnit = localStorage.getItem('companyUnit')
      if (storedCompanyUnit) {
        setCompanyUnit(storedCompanyUnit)
        setLoading(false)
        return
      }

      // If not in localStorage, check via API
      try {
        const response = await api.get('/api/workme/hydrate')
        if (response.data.success && response.data.workMe) {
          const unit = response.data.workMe.companyUnit
          setCompanyUnit(unit)
          if (unit) {
            localStorage.setItem('companyUnit', unit)
            if (response.data.workMe.companyDivision) {
              localStorage.setItem('companyDivision', response.data.workMe.companyDivision)
            }
          }
        }
      } catch (err) {
        console.error('Failed to check company unit:', err)
      } finally {
        setLoading(false)
      }
    }

    checkCompanyUnit()
  }, [])

  // Don't auto-redirect - let user stay on welcome page and click continue
  // Like IgniteBD - "hold on welcome bro" - just show welcome, no yanking
  
  const handleContinue = () => {
    // Check if user needs to complete setup
    if (!companyUnit) {
      router.push('/profile')
    } else {
      router.push('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8 bg-white/10 backdrop-blur-sm rounded-2xl p-12 shadow-2xl border border-white/20">
        <div className="space-y-4">
          <div className="mx-auto h-24 w-24 bg-white rounded-full flex items-center justify-center">
            <svg className="h-16 w-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white">
            Welcome to Work.me!
          </h1>
          <p className="text-xl text-white/90">
            Your career growth platform is ready
          </p>
        </div>
        
        <div className="space-y-6 text-left bg-white/5 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">1</span>
            </div>
          <div>
              <h3 className="text-lg font-semibold text-white mb-1">Track Your Achievements</h3>
              <p className="text-white/80">Document your professional accomplishments and impact</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">2</span>
            </div>
          <div>
              <h3 className="text-lg font-semibold text-white mb-1">Set Objectives</h3>
              <p className="text-white/80">Define goals and measure your progress</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">3</span>
            </div>
          <div>
              <h3 className="text-lg font-semibold text-white mb-1">Build Your Career</h3>
              <p className="text-white/80">Grow your network and advance your professional journey</p>
            </div>
          </div>
          </div>
          
        <div className="flex gap-4">
            <button
            onClick={handleContinue}
            className="flex-1 bg-white text-blue-700 py-4 px-8 rounded-xl font-semibold hover:bg-blue-50 transition shadow-lg"
            >
            Continue to Dashboard →
            </button>
          </div>

        {workMeId && (
          <p className="text-white/60 text-sm">
            Account ID: {workMeId.substring(0, 8)}...
          </p>
        )}
      </div>
    </div>
  )
}
