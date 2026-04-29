import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import {
  getAuth, signInAnonymously, signInWithPopup, linkWithPopup, linkWithCredential,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  GoogleAuthProvider, EmailAuthProvider, onAuthStateChanged, signOut as fbSignOut,
} from 'firebase/auth'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { useAuthStore } from '../store/authStore'

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})

if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  })
}

export const db = getFirestore(app)
export const auth = getAuth(app)
export const cloudEnabled = true

const googleProvider = new GoogleAuthProvider()

onAuthStateChanged(auth, (user) => {
  useAuthStore.getState().setUser(user)
})

export async function ensureAuth(): Promise<void> {
  if (auth.currentUser) return
  await signInAnonymously(auth)
}

export async function signInWithGoogle(): Promise<void> {
  const current = auth.currentUser
  if (current?.isAnonymous) {
    try {
      await linkWithPopup(current, googleProvider)
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'auth/credential-already-in-use') {
        await signInWithPopup(auth, googleProvider)
      } else {
        throw err
      }
    }
  } else {
    await signInWithPopup(auth, googleProvider)
  }
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const current = auth.currentUser
  if (current?.isAnonymous) {
    try {
      await linkWithCredential(current, EmailAuthProvider.credential(email, password))
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        throw err
      }
    }
  } else {
    await signInWithEmailAndPassword(auth, email, password)
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const current = auth.currentUser
  if (current?.isAnonymous) {
    try {
      await linkWithCredential(current, EmailAuthProvider.credential(email, password))
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use') {
        throw new Error('Ya existe una cuenta con ese email. Iniciá sesión en su lugar.')
      }
      throw err
    }
  } else {
    await createUserWithEmailAndPassword(auth, email, password)
  }
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(auth)
  await signInAnonymously(auth)
}
