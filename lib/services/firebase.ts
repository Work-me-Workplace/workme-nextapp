/**
 * Firebase Service
 * 
 * Service layer for Firebase authentication operations
 * Used by API routes and server actions
 */

import { auth } from '@/lib/firebaseAdmin'

export interface FirebaseUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export class FirebaseService {
  /**
   * Verify Firebase ID token and return user data
   */
  static async verifyToken(idToken: string): Promise<FirebaseUser> {
    try {
      const decodedToken = await auth.verifyIdToken(idToken)
      
      // Get full user record
      const user = await auth.getUser(decodedToken.uid)
      
      return {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
      }
    } catch (error: any) {
      throw new Error(`Firebase token verification failed: ${error.message}`)
    }
  }

  /**
   * Get Firebase user by UID
   */
  static async getUserByUid(uid: string): Promise<FirebaseUser> {
    try {
      const user = await auth.getUser(uid)
      
      return {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
      }
    } catch (error: any) {
      throw new Error(`Failed to get Firebase user: ${error.message}`)
    }
  }

  /**
   * Create Firebase user
   */
  static async createUser(email: string, password: string, displayName?: string): Promise<FirebaseUser> {
    try {
      const user = await auth.createUser({
        email,
        password,
        displayName,
      })
      
      return {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
      }
    } catch (error: any) {
      throw new Error(`Failed to create Firebase user: ${error.message}`)
    }
  }
}

