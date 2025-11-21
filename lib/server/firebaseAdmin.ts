/**
 * Firebase Admin SDK - SERVER ONLY
 * 
 * ⚠️ NEVER IMPORT THIS FILE IN CLIENT COMPONENTS
 * Only use in /app/api routes or other server modules
 * 
 * This file must NEVER be imported in:
 * - Client components ('use client')
 * - /app/** pages that are client components
 * - /lib files that are imported by client components
 */

import * as admin from 'firebase-admin'

let app: admin.app.App | null = null

export function getAdminApp() {
  if (!app) {
    if (!admin.apps.length) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

      if (!serviceAccountKey) {
        // During build, env vars might not be available - allow graceful failure
        if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
          console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not set during build - will fail at runtime if used')
          throw new Error(
            'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required. ' +
            'Set it in Vercel environment variables as a JSON string.'
          )
        }
        // For development/local builds, try alternative env var format
        const projectId = process.env.FIREBASE_PROJECT_ID
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
        const privateKey = process.env.FIREBASE_PRIVATE_KEY

        if (projectId && clientEmail && privateKey) {
          app = admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
          })
          console.log('✅ Firebase Admin initialized using individual env vars')
        } else {
          throw new Error(
            'FIREBASE_SERVICE_ACCOUNT_KEY (or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY) ' +
            'environment variable(s) are required.'
          )
        }
      } else {
        // Parse JSON string from env var
        try {
          const serviceAccount = JSON.parse(serviceAccountKey)
          app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          })
          console.log('✅ Firebase Admin initialized using FIREBASE_SERVICE_ACCOUNT_KEY')
        } catch (error: any) {
          console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error)
          throw new Error(
            'FIREBASE_SERVICE_ACCOUNT_KEY must be a valid JSON string. ' +
            'Copy the entire serviceAccountKey.json file contents as a single-line string.'
          )
        }
      }
    } else {
      app = admin.app()
    }
  }
  return app
}

export function getAdminAuth() {
  return getAdminApp().auth()
}

