'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SplashPage() {
  const router = useRouter()

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    
    const checkAuth = async () => {
      try {
        // Dynamically import Firebase to avoid SSR issues
        const { onAuthStateChanged } = await import('firebase/auth')
        const { auth } = await import('@/lib/firebase')
        
        if (auth) {
          unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              router.replace('/welcome')
            } else {
              router.replace('/signup')
            }
          })
        } else {
          // Firebase not configured - go to signup anyway
          console.warn('Firebase not configured - redirecting to signup')
          router.replace('/signup')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        // On error, just go to signup (graceful fallback)
        router.replace('/signup')
      }
    }

    // Small delay for splash effect
    const timer = setTimeout(() => {
      checkAuth()
    }, 2000)

    return () => {
      clearTimeout(timer)
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mx-auto mb-8 flex justify-center">
          <svg
            className="h-32 w-32 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">
          Work.me
        </h1>
        <p className="text-2xl text-white/90 mb-2">
          Your Network, Your Career
        </p>
        <p className="text-lg text-white/70">
          Build connections. Grow your career. Achieve your goals.
        </p>
      </div>
    </div>
  )
}
