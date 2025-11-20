/**
 * Firebase Client SDK - CLIENT-ONLY
 * 
 * ⚠️ Only import this in client components (files with 'use client')
 * Never use in server routes or API handlers
 */

'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { firebaseConfig as defaultConfig } from './firebase.config'

// Use env vars if set, otherwise use config file values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || defaultConfig.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || defaultConfig.measurementId,
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
