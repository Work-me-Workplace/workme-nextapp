/**
 * Firebase Client SDK - CLIENT-ONLY
 * 
 * ⚠️ Only import this in client components (files with 'use client')
 * Never use in server routes or API handlers
 */

'use client'

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { firebaseClientApp } from './firebaseClient'

const app = firebaseClientApp

export const auth = getAuth(app)

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Failed to set auth persistence:', error)
})

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user

  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    photoURL: user.photoURL,
  }
}

export async function signOutUser() {
  await signOut(auth)
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  const user = result.user

  if (displayName) {
    await updateProfile(user, { displayName })
  }

  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName || displayName,
    photoURL: user.photoURL,
  }
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password)
  const user = result.user

  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    photoURL: user.photoURL,
  }
}

export function getCurrentUser() {
  return auth.currentUser
}

export { app }

