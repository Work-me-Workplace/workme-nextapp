/**
 * API Client with Firebase Token Interceptor
 * 
 * Automatically injects Firebase ID tokens into all API requests
 * Replaces all fetch() calls throughout the application
 */

'use client'

import axios from 'axios'
import { getAuth } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const api = axios.create({
  baseURL: '', // Use current origin (relative URLs)
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - AUTOMATICALLY adds Firebase token to all requests
api.interceptors.request.use(
  async (config) => {
    // Ensure /api/* routes always use current origin (local Next.js routes)
    if (config.url && config.url.startsWith('/api/')) {
      config.baseURL = typeof window !== 'undefined' ? window.location.origin : ''
    }

    try {
      // Get Firebase auth instance
      const firebaseAuth = auth || getAuth()
      const user = firebaseAuth?.currentUser

      // If user is authenticated, add token to request
      if (user) {
        try {
          // Firebase SDK automatically refreshes tokens when you call getIdToken()
          const token = await user.getIdToken()
          config.headers.Authorization = `Bearer ${token}`
        } catch (error: any) {
          console.error('❌ Failed to get Firebase token:', error)
          // Don't block the request - let server handle auth failure
        }
      }
    } catch (error: any) {
      // Firebase not initialized yet - skip token for now
      // This can happen on initial page load before Firebase is ready
      if (error.code !== 'app/no-app') {
        console.warn('⚠️ Firebase auth not available:', error.message)
      }
    }

    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
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
      console.error('❌ API Request Unauthorized:', error.response.data)
      // Could redirect to signin here if needed
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('❌ API Request Forbidden:', error.response.data)
    }

    return Promise.reject(error)
  }
)

export default api
