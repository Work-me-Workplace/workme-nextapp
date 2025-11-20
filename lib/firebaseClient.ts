/**
 * Firebase Client SDK - CLIENT-ONLY
 * 
 * ⚠️ Only import this in client components (files with 'use client')
 * Never use in server routes or API handlers
 */

'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
}

// Only initialize in browser and if config is valid
let firebaseClientApp: FirebaseApp | null = null

if (typeof window !== 'undefined') {
  // Check if Firebase config is valid (at minimum need apiKey)
  const hasValidConfig = firebaseConfig.apiKey && firebaseConfig.projectId
  
  if (hasValidConfig) {
    try {
      // Initialize only if not already initialized
      firebaseClientApp =
        getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    } catch (error) {
      console.error('Firebase initialization error:', error)
      firebaseClientApp = null
    }
  } else {
    console.warn('Firebase config missing - set NEXT_PUBLIC_FIREBASE_* environment variables')
  }
}

export { firebaseClientApp }
