'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged, onIdTokenChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
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

  /**
   * Hydrate WorkMe + Company from server
   */
  const hydrateSession = useCallback(async (firebaseUser: User) => {
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

      // Mirror to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('workMeId', newSession.workMeId || '')
        localStorage.setItem('firebaseId', newSession.firebaseId || '')
        localStorage.setItem('email', newSession.email || '')
        if (newSession.companyUnit) {
          localStorage.setItem('companyUnit', newSession.companyUnit)
          // Dispatch custom event for same-tab updates
          window.dispatchEvent(new Event('companyUnitUpdated'))
        }
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
        // Only clear on actual auth failures
        console.warn('[AuthProvider] Auth error detected, clearing session')
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
          localStorage.removeItem('companyUnit')
          localStorage.removeItem('companyDivision')
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
      localStorage.removeItem('companyUnit')
      localStorage.removeItem('companyDivision')
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

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        console.log('[AuthProvider] User signed out')
        clearSession()
        setLoading(false)
        return
      }

      console.log('[AuthProvider] Auth state changed, hydrating session:', firebaseUser.uid)
      await hydrateSession(firebaseUser)
    })

    // Listen for token refresh
    const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[AuthProvider] Token refreshed')
        // Get fresh token and update session
        const token = await firebaseUser.getIdToken()
        setSession((prev) => ({
          ...prev,
          firebaseToken: token,
        }))

        // Update localStorage token
        if (typeof window !== 'undefined') {
          localStorage.setItem('firebaseToken', token)
        }

        // Optionally re-hydrate if session data might be stale
        // For now, just update token to avoid unnecessary API calls
      }
    })

    return () => {
      unsubscribeAuth()
      unsubscribeToken()
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
      {children}
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

