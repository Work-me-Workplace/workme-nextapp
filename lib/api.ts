/**
 * Global Axios Instance with Firebase Token Interceptor
 * 
 * AUTOMATICALLY attaches Firebase ID tokens to ALL API requests
 * No manual Authorization headers needed anywhere in the codebase
 * 
 * Usage:
 *   import api from '@/lib/api'
 *   const response = await api.post('/api/workstuff/ingest/create-training', { ... })
 */

'use client'

import axios from 'axios'
import { getIdToken } from '@/lib/firebase/getIdToken'

const api = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - ALWAYS attaches Firebase token; never send /api requests without one
api.interceptors.request.use(
  async (config) => {
    // Ensure /api/* routes use current origin
    if (config.url && config.url.startsWith('/api/')) {
      config.baseURL = typeof window !== 'undefined' ? window.location.origin : ''
    }

    const isApiRoute = config.url && config.url.startsWith('/api/')

    try {
      const token = await getIdToken()
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] ✅ Token attached to ${config.method?.toUpperCase()} ${config.url}`)
        }
      } else if (isApiRoute) {
        // Never send auth-required requests without a token — causes "Missing token" and kick-out
        const err = new Error('AUTH_NOT_READY') as any
        err.isAuthNotReady = true
        return Promise.reject(err)
      }
    } catch (error: any) {
      if (error?.isAuthNotReady) return Promise.reject(error)
      console.warn(`[API] ⚠️ Unable to attach token for ${config.method?.toUpperCase()} ${config.url}:`, error.message)
      if (isApiRoute) return Promise.reject(error)
    }

    return config
  },
  (error) => {
    console.error('[API] ❌ Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - handles errors globally
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.error('[API] ❌ Unauthorized (401):', error.response.data)
      // Don't auto-sign-out here - let AuthProvider handle it
      // Some 401s might be expected (e.g., expired token that will refresh)
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('[API] ❌ Forbidden (403):', error.response.data)
    }

    // Don't block on missing token warnings - let the request proceed
    // The server will return 401 if auth is actually required
    return Promise.reject(error)
  }
)

export default api
