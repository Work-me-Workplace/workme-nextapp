'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { onAuthStateChanged, onIdTokenChanged, User } from 'firebase/auth'
import { auth, authReady } from '@/lib/firebase'
import api from '@/lib/api'

/**
 * Unified Session Object
 * Single source of truth for user authentication state
 */
export interface Session {
  workMeId: string | null
  firebaseId: string | null
  email: string | null
  companyUnit: string | null
  companyDivision: string | null
  firebaseToken: string | null
  hydratedAt: number | null
}

interface AuthContextType {
  session: Session
  loading: boolean
  error: string | null
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: {
    workMeId: null,
    firebaseId: null,
    email: null,
    companyUnit: null,
    companyDivision: null,
    firebaseToken: null,
    hydratedAt: null,
  },
  loading: true,
  error: null,
  refreshSession: async () => {},
})

/**
 * AuthProvider Component
 * 
 * - Listens to Firebase auth state changes
 * - Hydrates WorkMe + Company data
 * - Manages unified session object
 * - Persists session to localStorage (mirror only)
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({
    workMeId: null,
    firebaseId: null,
    email: null,
    companyUnit: null,
    companyDivision: null,
    firebaseToken: null,
    hydratedAt: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** Tracks if we've ever had a user this session — only clear on null when this is true (real sign-out). */
  const hadUserRef = useRef(false)

  /**
   * Hydrate WorkMe + Company from server
   */
  const hydrateSession = useCallback(async (firebaseUser: User, isRetry = false) => {
    try {
      setLoading(true)
      setError(null)

      // Get token for session storage (not for API call - interceptor handles that)
      const token = await firebaseUser.getIdToken()

      // Call hydration endpoint
      // Token is automatically added by api interceptor - no manual header needed
      const response = await api.get('/api/workme/hydrate')

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to hydrate session')
      }

      const { workMe } = response.data

      // Build unified session object
      const newSession: Session = {
        workMeId: workMe.id,
        firebaseId: firebaseUser.uid,
        email: firebaseUser.email || workMe.email,
        companyUnit: workMe.companyUnit,
        companyDivision: workMe.companyDivision,
        firebaseToken: token,
        hydratedAt: Date.now(),
      }

      setSession(newSession)
      hadUserRef.current = true

      // Mirror to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('workMeId', newSession.workMeId || '')
        localStorage.setItem('firebaseId', newSession.firebaseId || '')
        localStorage.setItem('email', newSession.email || '')
        // companyUnit removed - use companyId only
        if (newSession.companyDivision) {
          localStorage.setItem('companyDivision', newSession.companyDivision)
        }
        if (newSession.firebaseToken) {
          localStorage.setItem('firebaseToken', newSession.firebaseToken)
        }
      }

      console.log('[AuthProvider] Session hydrated:', {
        workMeId: newSession.workMeId,
        companyUnit: newSession.companyUnit,
        companyDivision: newSession.companyDivision,
        email: newSession.email,
      })
    } catch (err: any) {
      console.error('[AuthProvider] Hydration error:', err)
      setError(err.message || 'Failed to hydrate session')
      
      // Don't clear session on hydration error - keep existing session
      // Only clear if it's an auth error (401/403)
      const isAuthError = err.response?.status === 401 || err.response?.status === 403 || 
                         err.message?.includes('Unauthorized') || 
                         err.message?.includes('not found')
      
      if (isAuthError) {
        // On 401, retry once with a fresh token (avoids kick-out on brief token expiry)
        if (!isRetry && auth?.currentUser) {
          try {
            await firebaseUser.getIdToken(true)
            await hydrateSession(firebaseUser, true)
            return
          } catch (_) {
            // Fall through to clear
          }
        }
        // Only clear on actual auth failures (or retry failed)
        console.warn('[AuthProvider] Auth error detected, clearing session')
        hadUserRef.current = false
        setSession({
          workMeId: null,
          firebaseId: null,
          email: null,
          companyUnit: null,
          companyDivision: null,
          firebaseToken: null,
          hydratedAt: null,
        })

        if (typeof window !== 'undefined') {
          localStorage.removeItem('workMeId')
          localStorage.removeItem('firebaseId')
          localStorage.removeItem('email')
          // companyUnit and companyDivision removed - use companyId only
          localStorage.removeItem('firebaseToken')
        }
      } else {
        // For other errors (500, network, etc), keep existing session
        // Try to preserve workMeId from localStorage if available
        const existingWorkMeId = typeof window !== 'undefined' ? localStorage.getItem('workMeId') : null
        if (existingWorkMeId) {
          console.log('[AuthProvider] Keeping existing session despite hydration error')
          setSession((prev) => ({
            ...prev,
            workMeId: existingWorkMeId,
            firebaseId: firebaseUser.uid,
            email: firebaseUser.email || prev.email,
          }))
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Clear session
   */
  const clearSession = useCallback(() => {
    hadUserRef.current = false
    setSession({
      workMeId: null,
      firebaseId: null,
      email: null,
      companyUnit: null,
      companyDivision: null,
      firebaseToken: null,
      hydratedAt: null,
    })
    setError(null)

    if (typeof window !== 'undefined') {
      localStorage.removeItem('workMeId')
      localStorage.removeItem('firebaseId')
      localStorage.removeItem('email')
      // companyUnit and companyDivision removed - use companyId only
      localStorage.removeItem('firebaseToken')
    }
  }, [])

  /**
   * Refresh session (re-hydrate)
   */
  const refreshSession = useCallback(async () => {
    if (!auth?.currentUser) {
      clearSession()
      return
    }
    await hydrateSession(auth.currentUser)
  }, [auth, hydrateSession, clearSession])

  useEffect(() => {
    if (!auth) {
      console.warn('[AuthProvider] Firebase auth not initialized')
      setLoading(false)
      return
    }

    let unsubscribeAuth: (() => void) | null = null
    let unsubscribeToken: (() => void) | null = null

    // Wait for persistence to be set so we don't get a spurious null before restore from storage
    authReady.then((readyAuth) => {
      if (!readyAuth) return

      unsubscribeAuth = onAuthStateChanged(readyAuth, async (firebaseUser) => {
        if (!firebaseUser) {
          // Only clear if we'd already had a user (real sign-out). Avoids kick-out on initial load or persistence delay.
          if (hadUserRef.current) {
            console.log('[AuthProvider] User signed out')
            clearSession()
          } else {
            console.log('[AuthProvider] No user (initial load or not signed in)')
          }
          setLoading(false)
          return
        }

        console.log('[AuthProvider] Auth state changed, hydrating session:', firebaseUser.uid)
        await hydrateSession(firebaseUser)
      })

      // Listen for token refresh
      unsubscribeToken = onIdTokenChanged(readyAuth, async (firebaseUser) => {
        if (firebaseUser) {
          console.log('[AuthProvider] Token refreshed')
          const token = await firebaseUser.getIdToken(false)
          setSession((prev) => ({
            ...prev,
            firebaseToken: token,
          }))
          if (typeof window !== 'undefined') {
            localStorage.setItem('firebaseToken', token)
          }
        }
      })
    })

    return () => {
      unsubscribeAuth?.()
      unsubscribeToken?.()
    }
  }, [auth, hydrateSession, clearSession])

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        error,
        refreshSession,
      }}
    >
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

