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

// Request interceptor - ALWAYS attaches Firebase token
api.interceptors.request.use(
  async (config) => {
    // Ensure /api/* routes use current origin
    if (config.url && config.url.startsWith('/api/')) {
      config.baseURL = typeof window !== 'undefined' ? window.location.origin : ''
    }

    // ALWAYS try to attach Firebase token
    try {
      const token = await getIdToken()
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
        console.log(`[API] ✅ Token attached to ${config.method?.toUpperCase()} ${config.url}`)
      } else {
        console.warn(`[API] ⚠️ No token available for ${config.method?.toUpperCase()} ${config.url}`)
      }
    } catch (error: any) {
      console.warn(`[API] ⚠️ Unable to attach token for ${config.method?.toUpperCase()} ${config.url}:`, error.message)
      // Don't block the request - let server handle auth failure
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
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('[API] ❌ Forbidden (403):', error.response.data)
    }

    return Promise.reject(error)
  }
)

export default api
